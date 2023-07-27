# frozen_string_literal: true

require 'rails_helper'

class ExampleJob < ApplicationJob
  def perform
    puts "Doing stuff..."
  end
end

RSpec.describe ApplicationJob, type: :job do
  it "enqueues job in Sidekiq directly" do
    expect { ExampleJob.perform_async }.to have_enqueued_job
    expect { ExampleJob.perform_async }.to have_enqueued_sidekiq_job
  end
end
