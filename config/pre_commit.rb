failed = false

illegal_strs = [ "<" * 3, "\t" ]
ARGV.each do |file|
  File.foreach(file).with_index do |line, line_num|
    illegal_strs.each do |illegal_str|
      index = line.index illegal_str
      if index
        STDERR.puts "#{file}:#{line_num+1}:#{index+1} Found illegal string #{illegal_str}"
        failed = true
      end
    end
  end
end

if failed
  exit 1
end
