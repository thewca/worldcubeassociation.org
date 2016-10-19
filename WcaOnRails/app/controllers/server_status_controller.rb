# frozen_string_literal: true
class ServerStatusController < ApplicationController
  MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING = 5

  def index
    @jobs_that_should_have_run_by_now = Delayed::Job.where(attempts: 0).where('created_at < ?', MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING.minutes.ago)
    @oldest_job_that_should_have_run_by_now = @jobs_that_should_have_run_by_now.order(:created_at).first

    @everything_good = @oldest_job_that_should_have_run_by_now.nil?

    if !@everything_good
      render status: 503
    end
  end
end
