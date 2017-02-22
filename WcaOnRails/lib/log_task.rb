# frozen_string_literal: true

module LogTask
  def self.log_task(description, &block)
    print "#{description}..."
    time = Benchmark.realtime(&block)
    puts format("done in %.2fs", time)
  end
end
