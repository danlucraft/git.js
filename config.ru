
require "net/https"

class GithubForwarder
  def initialize(app)
    @app = app
  end

  def call(env)
    path = env["REQUEST_PATH"]
    if path =~ /^\/github/
      new_path = path.gsub(/^\/github/, "")
      
      req = Rack::Request.new(env)
      method = req.request_method.downcase
      method[0..0] = method[0..0].upcase
      
      new_uri = "https://github.com#{new_path}"
      new_uri += "?#{env["QUERY_STRING"]}" unless env["QUERY_STRING"].to_s == ""
      new_uri = URI.parse(new_uri)
      
      sub_request = Net::HTTP.const_get(method).new("#{new_uri.path}#{"?" if new_uri.query}#{new_uri.query}")
      if sub_request.request_body_permitted? and req.body
        body = req.body.read
        sub_request.body = body
        sub_request.content_length = req.content_length
        sub_request.content_type = req.content_type
        if (req.content_type).include?("application/x-git-upload-pack-request")
          sub_request.content_type = "application/x-git-upload-pack-request"
        end
      end
      
      sub_request["X-Forwarded-For"] = (req.env["X-Forwarded-For"].to_s.split(/, +/) + [req.env['REMOTE_ADDR']]).join(", ")
      sub_request["Accept-Encoding"] = req.accept_encoding
      sub_request["Referer"] = req.referer
      
      session = Net::HTTP.new(new_uri.host, new_uri.port)
      if new_uri.scheme == "https"
        session.use_ssl = true
      end
      sub_response = session.start do |http|
        http.request(sub_request)
      end
      
      headers = {}
      sub_response.each_header do |k,v|
        headers[k] = v unless k.to_s =~ /cookie|content-length|transfer-encoding/i
      end
      body = sub_response.read_body
      
      [sub_response.code.to_i, headers, [body]]
    else
      @app.call(env)
    end
  end
end

use GithubForwarder

run proc { |env| 
  [200, {"Content-Type" => "text/html"}, [File.read(File.dirname(__FILE__) + env["REQUEST_URI"])]]
}
