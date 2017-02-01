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

    @ref_english = Locale.new('en')
    @bad_keys_by_type_by_locale = {}
    bad_keys_count = 0
    (I18n.available_locales - [:en]).each do |locale|
      ref_locale = Locale.new(locale, true)
      missing, unused, outdated = ref_locale.compare_to(@ref_english)
      bad_keys_by_type = { missing: missing, unused: unused, outdated: outdated }
      bad_keys_count += bad_keys_by_type.values.flatten.size
      @bad_keys_by_type_by_locale[locale] = bad_keys_by_type
    end
    @all_translations_perfect = bad_keys_count == 0

    if !@everything_good
      render status: 503
    end
  end
end
