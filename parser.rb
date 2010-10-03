#require 'rubygems'
require 'ext/myzlib'
require 'zlib'
class PackParser
  include MyZlib
  
  attr_reader :current
  
  def initialize(data)
    @current = @data = data
  end
  
  def parse
    p @data
    match_prefix
    match_version(2)
    num_objects = match_number_of_objects
    puts "expecting #{num_objects} objects"
    num_objects.times { match_object }
    nil
  end
  
  private
  
  def match_prefix
    if current[0..3] == "PACK"
      advance(4)
    else
      raise "couldn't match PACK"
    end
  end
  
  def match_version(num)
    version = current[0..3].unpack("N")[0]
    if version == num
      advance(4)
    else
      raise "need version 2, got #{version}"
    end
  end
  
  def match_number_of_objects
    num = current[0..3].unpack("N")[0]
    advance(4)
    num
  end
  
  def match_object
    header = match_object_header
    puts "\n\n*** matching object #{header[:type]} #{header[:size]}"
    p match_object_data(header)
  end
  
  def match_object_header
    hint_type_and_size = current[0].to_s(2)
    type               = nil
    size_infos         = []
    continue   =  (hint_type_and_size[0..0] == "1")
    type       =  hint_type_and_size[1..3]
    size_infos << hint_type_and_size[4..8]
    advance(1)
    while continue
      hint_and_size = current[0].to_s(2).rjust(8, "0")
      continue      = (hint_and_size[0..0] == "1")
      size_infos << hint_and_size[1..8]
      advance(1)
    end
    {:type => TYPES[type], :size => object_size_infos_to_size(size_infos)}
  end
  
  def match_object_data(header)
    myzlib_match_object_data(header)
  end
  
  def myzlib_match_object_data(header)
    back = inflate(header[:size], current, current.length)
    data, used = *back
    p [used, data.length]
    advance(used)
    data
  end
  
  def zlib_match_object_data(header)
    data = Zlib::Inflate.inflate(current)
    compressed_data = Zlib::Deflate.deflate(data)
    advance(compressed_data.length)
    p [compressed_data.length, data.length]
    data
  end
  
  def advance(bytes)
    @current = current[bytes..-1]
  end
  
  def object_size_infos_to_size(size_infos)
    current = 0
    current_shift = 0
    while size_info = size_infos.shift
      current += (size_info.to_i(2) << current_shift)
      current_shift += size_info.length
    end
    current
  end
  
  # def inflate(string, size)
  #  @zstream ||= Zlib::Inflate.new(15)
  #  @zstream.avail_out = size
  ##  begin
  #    buf = @zstream.inflate(string)
  #  rescue => e
  #    p e
  #  end
  #  @zstream.reset
  #  buf
  #end
    
  TYPES = {
    "001" => :commit,
    "010" => :tree,
    "011" => :blob,
    "100" => :tag,
    "110" => :ofs_delta,
    "111" => :ref_delta,
  }
  
end

class Parser
  attr_reader :current, :remotes, :packs
  
  def initialize(data)
    @data    = data
    @current = data
    @remotes = []
    @packs   = []
  end
  
  def parse
    if next_pkt_line == "NAK\n"
      puts "matched \"NAK\""
      while pkt_line = next_pkt_line
        if pkt_line[0] == "\002"[0]
          @remotes << pkt_line
        elsif pkt_line[0] == "\001"[0]
          @packs << PackParser.new(pkt_line[1..-1]).parse
        end
      end
    else
      raise "don't know how to handle non-NAK yet"
    end
  end
  
  def next_pkt_line
    length = current[0..4].to_i(16)
    pkt_line = current[4..(length-1)]
    @current = current[length..-1]
    pkt_line
  end
  
  def next_remote_line
    length = current[0..4].to_i(16)
    remote_line = current[4..(length - 1)]
    @current = current[length..-1]
    remote_line
  end
end  
  
parser = Parser.new(File.read("stream.bin"))
parser.parse
p parser.remotes
p parser.packs

