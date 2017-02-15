# frozen_string_literal: true
class ServerStatusController < ApplicationController
  MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING = 5

  def index
    @everything_good = true

    @jobs_that_should_have_run_by_now = Delayed::Job.where(attempts: 0).where('created_at < ?', MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING.minutes.ago)
    @oldest_job_that_should_have_run_by_now = @jobs_that_should_have_run_by_now.order(:created_at).first
    @everything_good &&= @oldest_job_that_should_have_run_by_now.blank?

    @regulations_load_error = Regulation.regulations_load_error
    @everything_good &&= @regulations_load_error.blank?

    @locale_stats = ApplicationController.locale_counts.sort_by { |locale, count| count }.reverse

    if !@everything_good
      render status: 503
    end
  end
end
