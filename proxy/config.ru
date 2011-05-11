require 'pp'
require "net/https"

# class GithubForwarder
#   def initialize(app)
#     @app = app
#   end
# 
#   def call(env)
#     puts
#     path = env["REQUEST_PATH"]
#     query_string = env["QUERY_STRING"]
#     puts "from: #{env["REQUEST_URI"]}"
#     if path =~ /\/github/ or query_string =~ /server=http:\/\/github/
#       if path =~ /\/github\//
#         new_uri = "https://github.com" + path.gsub("/github", "") + "?" + query_string
#       else
#         params = {}
#         query_string.split("&").each do |pair_string|
#           pair = pair_string.split("=")
#           params[pair[0]] = pair[1] ? URI.decode(pair[1]) : ""
#         end
#         username = params.delete("username")
#         password = params.delete("password")
#         server = params.delete("server")
#       
#         new_uri = "#{server}#{path}"
#         params.each do |key, value|
#           new_uri += "?" unless new_uri =~ /(\?|&)$/
#           new_uri += key + "=" + URI.encode(value)
#         end
#       end
#       req = Rack::Request.new(env)
#       method = req.request_method.downcase
#       method[0..0] = method[0..0].upcase
#       
#       puts "forwarding to: #{new_uri}"
#       new_uri = URI.parse(new_uri)
#       
#       sub_request = Net::HTTP.const_get(method).new("#{new_uri.path}#{"?" if new_uri.query}#{new_uri.query}")
#       if sub_request.request_body_permitted? and req.body
#         body = req.body.read
#         sub_request.body = body
#         puts "body        : #{body.inspect}"
#         sub_request.content_length = req.content_length
#         sub_request.content_type = req.content_type
#         if (req.content_type).include?("application/x-git-upload-pack-request")
#           sub_request.content_type = "application/x-git-upload-pack-request"
#         end
#       end
#       
#       sub_request["X-Forwarded-For"] = (req.env["X-Forwarded-For"].to_s.split(/, +/) + [req.env['REMOTE_ADDR']]).join(", ")
#       sub_request["Accept-Encoding"] = req.accept_encoding
#       sub_request["Referer"] = req.referer
#       session = Net::HTTP.new(new_uri.host, new_uri.port)
#       if new_uri.scheme == "https"
#         session.use_ssl = true
#       end
#       # sub_request.basic_auth(username, password)
#       sub_response = session.start do |http|
#         http.request(sub_request)
#       end
#       
#       headers = {}
#       sub_response.each_header do |k,v|
#         headers[k] = v unless k.to_s =~ /cookie|content-length|transfer-encoding/i
#       end
#       body = sub_response.read_body
#       p body[0..200]
#       File.open("response_body.bin", "w") {|fout| fout.print body}
#       puts "done"
#       [sub_response.code.to_i, headers, [body]]
#     else
#       @app.call(env)
#     end
#   end
# end
# 
# use GithubForwarder

def concat_js
  load_file = File.read(File.dirname(__FILE__) + "/../lib/jsgit-client.js")
  paths = load_file.scan(/getScript\("\/([^"]*)"\)/)
  js = ["jsGitInNode = false"]
  paths.each do |path|
    js << File.read(File.dirname(__FILE__) + "/../" + path.first)
  end
  total_js = js.join("\n\n")
  File.open("../lib/git.js", "w") {|f| f.puts total_js }
  [200, {"Content-Type" => "text/javascript"}, [total_js]]
end

run proc { |env|
  if env["PATH_INFO"] == "/favicon.ico"
    [404, {"Content-Type" => "image/png"}, ""]
  elsif env["PATH_INFO"] == "/git.js"
    concat_js
  else
    ext = env["PATH_INFO"].split(".").last
    p ext
    case ext
    when "js"
      content_type = "text/javascript"
    when "css"
      content_type = "text/css"
    else
      content_type = "text/html"
    end
      p env["REQUEST_PATH"]
    [200, {"Content-Type" => content_type}, [File.read(File.dirname(__FILE__) + "/../" + env["PATH_INFO"])]]
  end
}





