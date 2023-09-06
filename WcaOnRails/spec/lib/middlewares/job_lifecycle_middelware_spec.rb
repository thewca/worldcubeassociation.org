# frozen_string_literal: true

require 'middlewares/job_reporting_middleware'
require 'rails_helper'

class SuccessfulJob < ApplicationJob
  def perform
    puts "Succeeding!"
  end
end

class FailingJob < ApplicationJob
  sidekiq_options retry: true

  def perform
    raise "Failure!"
  end
end

RSpec.describe Middlewares::JobReportingMiddleware do
  it "stores completed jobs in completed_jobs table" do
    expect(Sidekiq::Worker.jobs.size).to eq 0

    SuccessfulJob.perform_later

    expect(Sidekiq::Worker.jobs.size).to eq 1

    Sidekiq::Worker.drain_all

    expect(Sidekiq::Worker.jobs.size).to eq 0
  end

  it "doesn't delete failed jobs, and notifies on failure" do
    expect(Sidekiq::Worker.jobs.size).to eq 0

    FailingJob.perform_later

    expect(Sidekiq::Worker.jobs.size).to eq 1

    # Create a worker and run this job until it's marked as failed.
    expect(JobFailureMailer).to receive(:notify_admin_of_job_failure).and_call_original
    expect { Sidekiq::Worker.drain_all }
      .to raise_error(RuntimeError)
      .and change { ActionMailer::Base.deliveries.length }.by(1)

    # NOTE: The 'sidekiq/testing' runner that is provided by Sidekiq does not have any retry mechanism
    # So we cannot expect for the job queue to be length 1 here -- it won't be enqueued in the test handler
    # and we have to trust that Sidekiq's test suite guarantees it'll just work in production :/
  end
end
