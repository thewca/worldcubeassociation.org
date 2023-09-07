# frozen_string_literal: true

require 'rails_helper'

class ExampleJob < WcaCronjob
  def perform
    puts "Doing stuff..."
  end
end

class ExampleJob2 < WcaCronjob
  def perform
    puts "Doing other stuff..."
  end
end

class SuccessfulJob < WcaCronjob
  def perform
    puts "Succeeding!"
  end
end

class FailingJob < WcaCronjob
  def perform
    raise "Failure!"
  end
end

RSpec.describe WcaCronjob, type: :job do
  it "doesn't enqueue the same job multiple times" do
    expect { ExampleJob.perform_later }.to change { enqueued_jobs.size }.by(1)
    expect { ExampleJob.perform_later }.to change { enqueued_jobs.size }.by(0)
  end

  it "doesn't enqueue a failed job again" do
    expect { FailingJob.perform_later }.to change { enqueued_jobs.size }.by(1)

    expect { perform_enqueued_jobs }.to raise_error(RuntimeError)

    expect { FailingJob.perform_later }.to change { enqueued_jobs.size }.by(0)
  end

  it "allows enqueuing multiple jobs of different types at the same time" do
    expect { ExampleJob.perform_later }.to change { enqueued_jobs.size }.by(1)
    expect { ExampleJob2.perform_later }.to change { enqueued_jobs.size }.by(1)
  end

  it "allows enqueuing the same job again after it has finished" do
    expect { ExampleJob.perform_later }.to change { enqueued_jobs.size }.by(1)

    perform_enqueued_jobs

    expect { ExampleJob.perform_later }.to change { enqueued_jobs.size }.by(1)
  end

  it "stores timestamps in cronjob_statistics table" do
    expect(SuccessfulJob.scheduled?).to eq false
    expect(SuccessfulJob.in_progress?).to eq false
    expect(SuccessfulJob.finished?).to eq false

    SuccessfulJob.perform_later

    expect(SuccessfulJob.scheduled?).to eq true
    expect(SuccessfulJob.in_progress?).to eq false
    expect(SuccessfulJob.finished?).to eq false

    perform_enqueued_jobs

    expect(SuccessfulJob.last_run_successful?).to eq true

    expect(SuccessfulJob.scheduled?).to eq false
    expect(SuccessfulJob.in_progress?).to eq false
    expect(SuccessfulJob.finished?).to eq true
  end

  it "doesn't delete failed jobs, and notifies on failure" do
    expect(FailingJob.scheduled?).to eq false
    expect(FailingJob.in_progress?).to eq false
    expect(FailingJob.finished?).to eq false

    FailingJob.perform_later

    expect(FailingJob.scheduled?).to eq true
    expect(FailingJob.in_progress?).to eq false
    expect(FailingJob.finished?).to eq false

    expect(JobFailureMailer).to receive(:notify_admin_of_job_failure).and_call_original
    expect { perform_enqueued_jobs }.to raise_error(RuntimeError).and change { ActionMailer::Base.deliveries.length }.by(1)

    expect(FailingJob.last_run_successful?).to eq false

    expect(FailingJob.scheduled?).to eq false
    expect(FailingJob.in_progress?).to eq false
    expect(FailingJob.finished?).to eq true
  end
end
