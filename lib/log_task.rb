# frozen_string_literal: true

module LogTask
  def self.log_task(description, &)
    Rails.logger.debug { "#{description}..." }
    time = Benchmark.realtime(&)
    Rails.logger.debug format("done in %.2fs", time)
  end
end
