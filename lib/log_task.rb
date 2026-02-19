# frozen_string_literal: true

module LogTask
  def self.log_task(description, &)
    Rails.logger.info { "#{description}..." }
    time = Benchmark.realtime(&)
    Rails.logger.info format("done in %.2fs", time)
  end
end
