# frozen_string_literal: true
class ServerStatusController < ApplicationController
  MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING = 5

  def index
    @jobs_that_should_have_run_by_now = Delayed::Job.where(attempts: 0).where('created_at < ?', MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING.minutes.ago)
    @oldest_job_that_should_have_run_by_now = @jobs_that_should_have_run_by_now.order(:created_at).first

    @everything_good = @oldest_job_that_should_have_run_by_now.nil?

    @ref_english = Locale.new('en')
    @bad_keys_by_type_by_locale = {}
    bad_keys_count = 0
    (I18n.available_locales - [:en]).each do |l|
      ref_locale = Locale.new(l, true)
      missing, unused, outdated = ref_locale.compare_to(@ref_english)
      @bad_keys_by_type_by_locale[l] = { missing: missing, unused: unused, outdated: outdated }
      bad_keys_count += @bad_keys_by_type_by_locale.values.flatten.size
    end
    @all_translations_perfect = bad_keys_count == 0

    if !@everything_good
      render status: 503
    end
  end
end
