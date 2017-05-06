# frozen_string_literal: true

class ApplicationJob < ActiveJob::Base
  class DeferJob < StandardError
    attr_reader :wait_time
    def initialize(wait_time)
      super
      @wait_time = wait_time
    end
  end

  rescue_from(DeferJob) do |defer_job|
    retry_job wait: defer_job.wait_time
  end

  def defer_job_for(wait_time)
    # This is always caught in the rescue_from above. It allows us to escape out of the job and put it off.
    raise DeferJob.new(wait_time)
  end
end
