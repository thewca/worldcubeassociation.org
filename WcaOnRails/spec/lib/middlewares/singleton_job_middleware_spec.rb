# frozen_string_literal: true

require 'middlewares/singleton_job_middleware'
require 'rails_helper'

class SampleJob < ApplicationJob
  def perform
    puts "Succeeding!"
  end
end

class ArbitraryJob < ActiveJob::Base
  def perform
    puts "Succeeding as many times as you want!"
  end
end

RSpec.describe Middlewares::SingletonJobMiddleware do
  it "doesn't enqueue the same job on wca queue multiple times" do
    expect { SampleJob.perform_later }.to change { Sidekiq::Worker.jobs.size }.by(1)
    expect { SampleJob.perform_later }.to change { Sidekiq::Worker.jobs.size }.by(0)
  end

  it "counts how many times a job has been rejected" do
    expect(Sidekiq::Worker.jobs.size).to be(0)
    expect(JobStatistic.count).to be(0)

    SampleJob.perform_later

    job_statistics = SampleJob.job_statistics
    expect(job_statistics.recently_rejected).to be(0)

    SampleJob.perform_later

    job_statistics.reload
    expect(job_statistics.recently_rejected).to be(1)
  end

  it "resets the rejected job counter upon successful rerun" do
    expect(Sidekiq::Worker.jobs.size).to be(0)
    expect(JobStatistic.count).to be(0)

    SampleJob.perform_later

    job_statistics = SampleJob.job_statistics
    expect(job_statistics.recently_rejected).to be(0)

    SampleJob.perform_later

    job_statistics.reload
    expect(job_statistics.recently_rejected).to be(1)

    Sidekiq::Worker.drain_all

    job_statistics.reload
    expect(job_statistics.recently_rejected).to be(0)
  end

  it "allows enqueuing multiple jobs of different types at the same time" do
    expect { SampleJob.perform_later }.to change { Sidekiq::Worker.jobs.size }.by(1)
    expect { ArbitraryJob.perform_later }.to change { Sidekiq::Worker.jobs.size }.by(1)
  end

  it "allows enqueuing multiple jobs on default queue at the same time" do
    expect { ArbitraryJob.perform_later }.to change { Sidekiq::Worker.jobs.size }.by(1)
    expect { ArbitraryJob.perform_later }.to change { Sidekiq::Worker.jobs.size }.by(1)
  end
end
