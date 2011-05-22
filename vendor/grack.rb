require 'zlib'
require 'rack/request'
require 'rack/response'
require 'rack/utils'
require 'time'

class GitHttp
  class App 
    ALLOWED_XDOMAINS = "http://localhost:9292"
    
    SERVICES = [
      [["POST"], 'service_rpc',      "(.*?)/git-upload-pack$",  'upload-pack'],
      [["POST"], 'service_rpc',      "(.*?)/git-receive-pack$", 'receive-pack'],

      [["GET", "HEAD"],  'get_info_refs',    "(.*?)/info/refs$"],
      [["GET", "HEAD"],  'get_text_file',    "(.*?)/HEAD$"],
      [["GET", "HEAD"],  'get_text_file',    "(.*?)/objects/info/alternates$"],
      [["GET", "HEAD"],  'get_text_file',    "(.*?)/objects/info/http-alternates$"],
      [["GET", "HEAD"],  'get_info_packs',   "(.*?)/objects/info/packs$"],
      [["GET", "HEAD"],  'get_text_file',    "(.*?)/objects/info/[^/]*$"],
      [["GET", "HEAD"],  'get_loose_object', "(.*?)/objects/[0-9a-f]{2}/[0-9a-f]{38}$"],
      [["GET", "HEAD"],  'get_pack_file',    "(.*?)/objects/pack/pack-[0-9a-f]{40}\\.pack$"],
      [["GET", "HEAD"],  'get_idx_file',     "(.*?)/objects/pack/pack-[0-9a-f]{40}\\.idx$"],      
    ]

    def initialize(config = false)
      set_config(config)
    end

    def set_config(config)
      @config = config || {}
    end

    def set_config_setting(key, value)
      @config[key] = value
    end

    def call(env)
      puts "git.js requested: " + env["REQUEST_URI"]
      return render_access_control(env) if requesting_access_control?(env)
        
      @env = env
      @req = Rack::Request.new(env)
      
      cmd, path, @reqfile, @rpc = match_routing

      return render_method_not_allowed if cmd == 'not_allowed'
      return render_not_found if !cmd

      @dir = get_git_dir(path)
      return render_not_found if !@dir

      Dir.chdir(@dir) do
        self.method(cmd).call()
      end
    end

    def head_request?
      @req.request_method == "HEAD"
    end
    
    # ---------------------------------
    # actual command handling functions
    # ---------------------------------

    def bytes_to_string(bytes)
      s = " "*bytes.length
      bytes.each_with_index {|b, i| s[i] = b}
      s
    end
    
    def service_rpc
      return render_no_access if !has_access(@rpc, true)
      input = read_body
      
      @res = Rack::Response.new
      @res.status = 200
      @res["Content-Type"] = "application/x-git-%s-result" % @rpc
      set_access_control
      bs = []
      @res.finish do
        command = git_command("#{@rpc} --stateless-rpc #{@dir}")
        puts command
        IO.popen(command, File::RDWR) do |pipe|
          pipe.write(input)
          pipe.close_write
          puts "wrote input"
          while !pipe.eof?
            block = pipe.read(8192) # 8K at a time
            block.each_byte {|b| bs << b}
            @res.write(block)        # steam it to the client
          end
        end
      end
    end
    
    def get_info_refs
      service_name = get_service_type

      if has_access(service_name)
        cmd = git_command("#{service_name} --stateless-rpc --advertise-refs .")
        refs = `#{cmd}`

        @res = Rack::Response.new
        @res.status = 200
        @res["Content-Type"] = "application/x-git-%s-advertisement" % service_name
        set_access_control
        hdr_nocache
        @res.write(pkt_write("# service=git-#{service_name}\n"))
        @res.write(pkt_flush)
        @res.write(refs)
        @res.finish
      else
        dumb_info_refs
      end
    end

    def dumb_info_refs
      update_server_info
      send_file(@reqfile, "text/plain; charset=utf-8") do
        hdr_nocache
      end
    end

    def get_info_packs
      # objects/info/packs
      send_file(@reqfile, "text/plain; charset=utf-8") do
        hdr_nocache
      end
    end

    def get_loose_object
      send_file(@reqfile, "application/x-git-loose-object") do
        hdr_cache_forever
      end
    end

    def get_pack_file
      send_file(@reqfile, "application/x-git-packed-objects") do
        hdr_cache_forever
      end
    end

    def get_idx_file
      send_file(@reqfile, "application/x-git-packed-objects-toc") do
        hdr_cache_forever
      end
    end

    def get_text_file
      send_file(@reqfile, "text/plain") do
        hdr_nocache
      end
    end

    # ------------------------
    # logic helping functions
    # ------------------------

    F = ::File

    # some of this borrowed from the Rack::File implementation
    def send_file(reqfile, content_type)
      reqfile = File.join(@dir, reqfile)
      return render_not_found if !F.exists?(reqfile)

      @res = Rack::Response.new
      @res.status = 200
      @res["Content-Type"]  = content_type
      @res["Last-Modified"] = F.mtime(reqfile).httpdate
      set_access_control

      yield

      if size = F.size?(reqfile)
        @res["Content-Length"] = size.to_s
        @res.finish do
          unless head_request?
            s = []
            F.open(reqfile, "rb") do |file|
              while part = file.read(8192)
                s << part
                @res.write part
              end
            end
            # p s.join("")
          end
        end
      else
        if head_request?
          body = ""
        else
          body = [F.read(reqfile)]
        end
        size = Rack::Utils.bytesize(body.first)
        @res["Content-Length"] = size.to_s
        # p body
        @res.write body
        @res.finish
      end
    end

    def get_git_dir(path)
      root = @config[:project_root] || `pwd`
      path = File.join(root, path)
      if File.exists?(path) # TODO: check is a valid git directory
        return path
      end
      false
    end

    def get_service_type
      service_type = @req.params['service']
      return false if !service_type
      return false if service_type[0, 4] != 'git-'
      service_type.gsub('git-', '')
    end

    def match_routing
      cmd = nil
      path = nil
      SERVICES.each do |method, handler, match, rpc|
        if m = Regexp.new(match).match(@req.path_info)
          return ['not_allowed'] unless method.include?(@req.request_method)
          cmd = handler
          if path = m[1]
            file = @req.path_info.sub(path + '/', '')
          else
            file = nil
          end
          return [cmd, path, file, rpc]
        end
      end
      return nil
    end

    def has_access(rpc, check_content_type = false)
      if check_content_type
        return false unless @req.content_type.include?("application/x-git-%s-request" % rpc)
      end
      return false if !['upload-pack', 'receive-pack'].include? rpc
      if rpc == 'receive-pack'
        return @config[:receive_pack] if @config.include? :receive_pack
      end
      if rpc == 'upload-pack'
        return @config[:upload_pack] if @config.include? :upload_pack
      end
      return get_config_setting(rpc)
    end

    def get_config_setting(service_name)
      service_name = service_name.gsub('-', '')
      setting = get_git_config("http.#{service_name}")
      if service_name == 'uploadpack'
        return setting != 'false'
      else
        return setting == 'true'
      end
    end

    def get_git_config(config_name)
      cmd = git_command("config #{config_name}")
      `#{cmd}`.chomp
    end

    def read_body
      if @env["HTTP_CONTENT_ENCODING"] =~ /gzip/
        input = Zlib::GzipReader.new(@req.body).read
      else
        input = @req.body.read
      end
    end

    def update_server_info
      cmd = git_command("update-server-info")
      `#{cmd}`
    end

    def git_command(command)
      git_bin = @config[:git_path] || 'git'
      command = "#{git_bin} #{command}"
      command
    end

    # --------------------------------------
    # HTTP error response handling functions
    # --------------------------------------

    PLAIN_TYPE = {
      "Content-Type" => "text/plain",
      "Access-Control-Allow-Origin" => ALLOWED_XDOMAINS
    }

    def render_method_not_allowed
      if @env['SERVER_PROTOCOL'] == "HTTP/1.1"
        [405, PLAIN_TYPE, ["Method Not Allowed"]]
      else
        [400, PLAIN_TYPE, ["Bad Request"]]
      end
    end

    def render_not_found
      [404, PLAIN_TYPE, ["Not Found"]]
    end

    def render_no_access
      puts "render_no_access"
      [403, PLAIN_TYPE, ["Forbidden"]]
    end

    def requesting_access_control?(env)
      env["REQUEST_METHOD"] == "OPTIONS" &&
        (env["HTTP_ACCESS_CONTROL_REQUEST_METHOD"] or env["HTTP_ACCESS_CONTROL_REQUEST_HEADERS"])
    end
    
    def render_access_control(env)
      headers = PLAIN_TYPE
      if requested_method = env["HTTP_ACCESS_CONTROL_REQUEST_METHOD"]
        headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, HEAD"
      end
      
      if requested_headers = env["HTTP_ACCESS_CONTROL_REQUEST_HEADERS"]
        headers["Access-Control-Allow-Headers"] = requested_headers
      end
      headers["Access-Control-Expose-Headers"] = "Content-Length"
      
      if requested_headers || requested_method
        headers["Access-Control-Max-Age"] = (60*60*24).to_s
      end
      # puts "returning access control #{headers.inspect}"
      [200, headers, ""]
    end      
    
    # ------------------------------
    # packet-line handling functions
    # ------------------------------

    def pkt_flush
      '0000'
    end

    def pkt_write(str)
      (str.size + 4).to_s(base=16).rjust(4, '0') + str
    end


    # ------------------------
    # header writing functions
    # ------------------------

    def hdr_nocache
      @res["Expires"] = "Fri, 01 Jan 1980 00:00:00 GMT"
      @res["Pragma"] = "no-cache"
      @res["Cache-Control"] = "no-cache, max-age=0, must-revalidate"
    end

    def hdr_cache_forever
      now = Time.now().to_i
      @res["Date"] = now.to_s
      @res["Expires"] = (now + 31536000).to_s;
      @res["Cache-Control"] = "public, max-age=31536000";
    end
    
    def set_access_control
      @res["Access-Control-Allow-Origin"] = ALLOWED_XDOMAINS
      @res["Access-Control-Expose-Headers"] = "Content-Length"
    end
  end
end