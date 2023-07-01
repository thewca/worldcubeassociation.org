# frozen_string_literal: true

require 'rails_helper'

class ExampleJob < ApplicationJob
  include SingletonApplicationJob

  queue_as :default

  def perform
    puts "Doing stuff..."
  end
end

class ExampleJob2 < ApplicationJob
  include SingletonApplicationJob

  queue_as :default

  def perform
    puts "Doing other stuff..."
  end
end

RSpec.describe SingletonApplicationJob, type: :job do
  # Copied from spec/lib/delayed/plugins/save_completed_jobs_spec.rb
  around(:each) do |example|
    old_delay_jobs = Delayed::Worker.delay_jobs
    old_queue_adapter = ActiveJob::Base.queue_adapter
    old_test_adapter = ActiveJob::Base._test_adapter
    Delayed::Worker.delay_jobs = true
    ActiveJob::Base.queue_adapter = :delayed_job
    ActiveJob::Base.disable_test_adapter
    example.run
    Delayed::Worker.delay_jobs = old_delay_jobs
    ActiveJob::Base.queue_adapter = old_queue_adapter
    ActiveJob::Base.enable_test_adapter(old_test_adapter)
  end

  it "doesn't enqueue the same job multiple times" do
    expect { ExampleJob.perform_later }.to change { Delayed::Job.count }.by(1)
    expect { ExampleJob.perform_later }.to change { Delayed::Job.count }.by(0)
  end

  it "allows enqueuing multiple jobs of different types at the same time" do
    expect { ExampleJob.perform_later }.to change { Delayed::Job.count }.by(1)
    expect { ExampleJob2.perform_later }.to change { Delayed::Job.count }.by(1)
  end
end
