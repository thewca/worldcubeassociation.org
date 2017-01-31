failed = false

illegal_strs = {
  ("<" * 3) => "conflict marker",
  "\t" => "tab",
  "\r" => "carriage return",
  "\uFEFF" => "byte order marker (BOM)",
  ("WCA " + "id") => "We prefer 'WCA ID', see https://github.com/thewca/worldcubeassociation.org/issues/268",
}
ARGV.each do |file|
  File.foreach(file).with_index do |line, line_num|
    illegal_strs.each do |illegal_str, description|
      index = line.index illegal_str
      if index
        STDERR.puts "#{file}:#{line_num+1}:#{index+1} Found illegal string: #{description}"
        failed = true
      end
    end
  end
end

if failed
  exit 1
end
