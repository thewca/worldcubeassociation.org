# frozen_string_literal: true
require 'rails_helper'

RSpec.describe ServerStatusController, type: :controller do
  it "finds the oldest job that has been waiting to run" do
    _old_job = Delayed::Job.create(created_at: 10.minutes.ago, handler: "")
    oldest_job = Delayed::Job.create(created_at: 15.minutes.ago, handler: "")

    get :index

    oldest_job_that_should_have_run_by_now = assigns(:oldest_job_that_should_have_run_by_now)
    expect(oldest_job_that_should_have_run_by_now).to eq oldest_job

    expect(assigns(:everything_good)).to eq false
  end

  it "ignores young jobs" do
    _young_job = Delayed::Job.create(created_at: 1.minutes.ago, handler: "")

    get :index

    oldest_job_that_should_have_run_by_now = assigns(:oldest_job_that_should_have_run_by_now)
    expect(oldest_job_that_should_have_run_by_now).to eq nil

    expect(assigns(:everything_good)).to eq true
  end
end
