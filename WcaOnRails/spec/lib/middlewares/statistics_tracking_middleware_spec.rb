# frozen_string_literal: true

require 'middlewares/statistics_tracking_middleware'
require 'rails_helper'

class SuccessfulJob < ApplicationJob
  def perform
    puts "Yup, that worked!"
  end
end

class FailingJob < ApplicationJob
  ERROR_MESSAGE = "Whoops…"

  def perform(should_fail: true)
    raise ERROR_MESSAGE if should_fail
  end
end

class DefaultJob < ActiveJob::Base
  def perform
    puts "This is an irrelevant job :("
  end
end

class DummyMailer < ApplicationMailer
  def send_dummy_email
    mail(
      to: "software@worldcubeassociation.org",
      subject: "This is a dummy test email!",
    )
  end
end

RSpec.describe Middlewares::StatisticsTrackingMiddleware do
  it "doesn't track statistics for jobs on default queue" do
    expect(Sidekiq::Worker.jobs.size).to be(0)
    expect(CronjobStatistic.count).to be(0)

    DefaultJob.perform_later

    expect(Sidekiq::Worker.jobs.size).to be(1)
    expect(CronjobStatistic.count).to be(0)

    Sidekiq::Worker.drain_all

    expect(Sidekiq::Worker.jobs.size).to be(1)
    expect(CronjobStatistic.count).to be(0)
  end

  it "doesn't track statistics for jobs on mailer queue" do
    expect(Sidekiq::Worker.jobs.size).to be(0)
    expect(CronjobStatistic.count).to be(0)

    DummyMailer.send_dummy_email.deliver_later

    expect(Sidekiq::Worker.jobs.size).to be(1)
    expect(CronjobStatistic.count).to be(0)

    Sidekiq::Worker.drain_all

    expect(Sidekiq::Worker.jobs.size).to be(0)
    expect(CronjobStatistic.count).to be(0)
  end

  context "successful job" do
    it "creates new statistics on demand" do
      expect(Sidekiq::Worker.jobs.size).to be(0)
      expect(CronjobStatistic.count).to be(0)

      job_statistics = SuccessfulJob.job_statistics

      # We intentionally want to return an *empty* statistics object, never nil!
      expect(job_statistics).to_not be_nil

      expect(job_statistics.last_run_successful).to be(false)
      expect(job_statistics.times_completed).to be(0)
      expect(job_statistics.average_runtime).to be_nil

      SuccessfulJob.perform_now

      expect(CronjobStatistic.count).to be(1)
    end

    it "records job as finished" do
      expect(Sidekiq::Worker.jobs.size).to be(0)
      expect(CronjobStatistic.count).to be(0)

      SuccessfulJob.perform_now

      is_finished = SuccessfulJob.finished?
      expect(is_finished).to be(true)
    end

    it "counts successful job runs" do
      expect(Sidekiq::Worker.jobs.size).to be(0)
      expect(CronjobStatistic.count).to be(0)

      SuccessfulJob.perform_now

      job_statistics = SuccessfulJob.job_statistics

      expect(job_statistics.last_run_successful).to be(true)
      expect(job_statistics.times_completed).to be(1)
      expect(job_statistics.average_runtime).to_not be_nil

      # trigger re-run
      SuccessfulJob.perform_now

      job_statistics.reload
      expect(job_statistics.times_completed).to be(2)
    end
  end

  context "unsuccessful job" do
    it "records the error" do
      expect(Sidekiq::Worker.jobs.size).to be(0)
      expect(CronjobStatistic.count).to be(0)

      FailingJob.perform_now

      job_statistics = FailingJob.job_statistics

      expect(job_statistics.last_run_successful).to be(false)
      expect(job_statistics.recently_errored).to be(1)
      expect(job_statistics.last_error_message).to be(FailingJob::ERROR_MESSAGE)
    end

    it "does not count errors towards the runtime" do
      expect(Sidekiq::Worker.jobs.size).to be(0)
      expect(CronjobStatistic.count).to be(0)

      FailingJob.perform_now

      job_statistics = FailingJob.job_statistics

      expect(job_statistics.recently_errored).to be(1)
      expect(job_statistics.average_runtime).to be_nil
    end

    it "counts the retries" do
      expect(Sidekiq::Worker.jobs.size).to be(0)
      expect(CronjobStatistic.count).to be(0)

      FailingJob.perform_now

      job_statistics = FailingJob.job_statistics
      expect(job_statistics.recently_errored).to be(1)

      # trigger re-run
      FailingJob.perform_now

      job_statistics.reload
      expect(job_statistics.recently_errored).to be(2)
    end

    it "resets error count on successful run" do
      expect(Sidekiq::Worker.jobs.size).to be(0)
      expect(CronjobStatistic.count).to be(0)

      FailingJob.perform_now

      job_statistics = FailingJob.job_statistics
      expect(job_statistics.recently_errored).to be(1)

      # trigger succeeding run
      FailingJob.perform_now should_fail: false

      job_statistics.reload
      expect(job_statistics.recently_errored).to be(0)
    end
  end
end
