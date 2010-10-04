
require "net/http"

# Example Usage:
#
# use Rack::Proxy do |req|
#   if req.path =~ %r{^/remote/service.php$}
#     URI.parse("http://remote-service-provider.com/service-end-point.php?#{req.query}")
#   end
# end
#
# run proc{|env| [200, {"Content-Type" => "text/plain"}, ["Ha ha ha"]] }
#
class Rack::Proxy
  def initialize(app, &block)
    self.class.send(:define_method, :uri_for, &block)
    @app = app
  end

  def call(env)
    p env["REQUEST_URI"]
    req = Rack::Request.new(env)
    method = req.request_method.downcase
    method[0..0] = method[0..0].upcase

    return @app.call(env) unless uri = uri_for(req)

    sub_request = Net::HTTP.const_get(method).new("#{uri.path}#{"?" if uri.query}#{uri.query}")
    if sub_request.request_body_permitted? and req.body
      body = req.body.read
      p [:body, body]
      sub_request.body = body
      sub_request.content_length = req.content_length
      sub_request.content_type = req.content_type
      p req.content_type
      if (req.content_type).include?("application/x-git-upload-pack-request")
        sub_request.content_type = "application/x-git-upload-pack-request"
      end
      
    end

    sub_request["X-Forwarded-For"] = (req.env["X-Forwarded-For"].to_s.split(/, +/) + [req.env['REMOTE_ADDR']]).join(", ")
    sub_request["Accept-Encoding"] = req.accept_encoding
    sub_request["Referer"] = req.referer
    
    sub_response = Net::HTTP.start(uri.host, uri.port) do |http|
      http.request(sub_request)
    end

    headers = {}
    sub_response.each_header do |k,v|
      headers[k] = v unless k.to_s =~ /cookie|content-length|transfer-encoding/i
    end
    body = sub_response.read_body
    File.open("result.bin", "w") {|fout| fout.print body }
    [sub_response.code.to_i, headers, [body]]
  end
end

use Rack::Proxy do |req|
  path = req.path
  if path =~ /^\/github/
    github_path = path.gsub(/^\/github/, "")
    if query = req.query_string and query != ""
      uri = "http://github.com#{github_path}?#{query}"
    else
      uri = "http://github.com#{github_path}"
    end
    puts "FETCH #{uri}"
    URI.parse(uri)
  end
end

run proc { |env| 
  [200, {"Content-Type" => "text/html"}, [File.read(File.dirname(__FILE__) + "/../jsgit" + env["REQUEST_URI"])]]
}
