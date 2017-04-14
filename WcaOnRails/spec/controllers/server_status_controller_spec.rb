# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ServerStatusController, type: :controller do
  before :each do
    allow(File).to receive(:read).with(any_args).and_call_original
    allow(File).to receive(:read).with(Regulation::REGULATIONS_JSON_PATH).and_return("{}")
    Regulation.reload_regulations
  end

  it "is happy" do
    get :index

    expect(assigns(:everything_good)).to eq true
  end

  context "jobs" do
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

  context "regulations" do
    it "warns about missing regulations" do
      allow(File).to receive(:read).with(any_args).and_call_original
      allow(File).to receive(:read).with(Regulation::REGULATIONS_JSON_PATH).and_raise(Errno::ENOENT.new)
      Regulation.reload_regulations

      get :index

      expect(assigns(:everything_good)).to eq false
    end

    it "warns about malformed regulations" do
      allow(File).to receive(:read).with(any_args).and_call_original
      allow(File).to receive(:read).with(Regulation::REGULATIONS_JSON_PATH).and_return("i am definitely not json")
      Regulation.reload_regulations

      get :index

      expect(assigns(:everything_good)).to eq false
    end
  end
end
