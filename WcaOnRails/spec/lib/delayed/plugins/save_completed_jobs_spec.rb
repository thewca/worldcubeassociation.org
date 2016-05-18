require 'rails_helper'

class SuccessfulJob < ActiveJob::Base
  def perform
    puts "Succeeding!"
  end
end

class FailingJob < ActiveJob::Base
  def perform
    raise "Failure!"
  end
end

describe Delayed::Plugins::SaveCompletedJobs, type: :feature do
  describe "call" do
    around(:each) do |example|
      old_delay_jobs = Delayed::Worker.delay_jobs
      old_queue_adapter = ActiveJob::Base.queue_adapter
      Delayed::Worker.delay_jobs = true
      ActiveJob::Base.queue_adapter = :delayed_job
      example.run
      Delayed::Worker.delay_jobs = old_delay_jobs
      ActiveJob::Base.queue_adapter = old_queue_adapter
    end

    it "stores completed jobs in completed_jobs table" do
      expect(Delayed::Job.count).to eq 0
      expect(CompletedJob.count).to eq 0

      SuccessfulJob.perform_later

      expect(Delayed::Job.count).to eq 1
      expect(CompletedJob.count).to eq 0

      dw = Delayed::Worker.new
      dj = Delayed::Job.last
      dw.run dj

      expect(Delayed::Job.count).to eq 0
      expect(CompletedJob.count).to eq 1
    end

    it "doesn't delete failed jobs" do
      expect(Delayed::Job.count).to eq 0
      expect(CompletedJob.count).to eq 0

      FailingJob.perform_later

      expect(Delayed::Job.count).to eq 1
      job = Delayed::Job.first
      expect(job.failed_at).to eq nil
      expect(CompletedJob.count).to eq 0

      # Create a worker and run this job until it's marked as failed.
      dw = Delayed::Worker.new
      Delayed::Worker.max_attempts.times do
        dw.run Delayed::Job.last
      end

      expect(Delayed::Job.count).to eq 1
      job.reload
      expect(job.failed_at).not_to eq nil
      expect(CompletedJob.count).to eq 0
    end
  end
end
