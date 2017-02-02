# frozen_string_literal: true
class ServerStatusController < ApplicationController
  MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING = 5

  def self.bad_i18n_keys
    @bad_keys ||= (I18n.available_locales - [:en]).each_with_object({}) do |locale, hash|
      ref_english = Locale.new('en')
      missing, unused, outdated = Locale.new(locale, true).compare_to(ref_english)
      hash[locale] = { missing: missing, unused: unused, outdated: outdated }
    end
  end

  def index
    @everything_good = true

    @jobs_that_should_have_run_by_now = Delayed::Job.where(attempts: 0).where('created_at < ?', MINUTES_IN_WHICH_A_JOB_SHOULD_HAVE_STARTED_RUNNING.minutes.ago)
    @oldest_job_that_should_have_run_by_now = @jobs_that_should_have_run_by_now.order(:created_at).first
    @everything_good &&= @oldest_job_that_should_have_run_by_now.blank?

    @regulations_load_error = Regulation.regulations_load_error
    @everything_good &&= @regulations_load_error.blank?

    @bad_i18n_keys = self.class.bad_i18n_keys
    bad_keys = @bad_i18n_keys.values.map(&:values).flatten
    @all_translations_perfect = bad_keys.empty?

    if !@everything_good
      render status: 503
    end
  end
end
