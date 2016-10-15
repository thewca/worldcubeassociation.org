# frozen_string_literal: true
class ServerStatusController < ApplicationController
  def index
    @oldest_job_that_should_have_run_by_now = Delayed::Job.
        where(attempts: 0).where('created_at < ?', 5.minutes.ago).
        order(:created_at).
        first

    @everything_good = @oldest_job_that_should_have_run_by_now.nil?

    if !@everything_good
      render status: 503
    end
  end
end
