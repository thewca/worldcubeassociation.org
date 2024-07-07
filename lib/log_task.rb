# frozen_string_literal: true

module LogTask
  def self.log_task(description, &)
    print "#{description}..."
    time = Benchmark.realtime(&)
    puts format('done in %.2fs', time)
  end
end
