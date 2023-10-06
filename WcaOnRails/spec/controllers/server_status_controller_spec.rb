# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ServerStatusController, type: :controller do
  it "is happy" do
    allow_any_instance_of(ServerStatusController).to receive(:checks).and_return([HappyCheck.new])

    get :index

    expect(response).to have_http_status 200
  end

  it "can fail" do
    allow_any_instance_of(ServerStatusController).to receive(:checks).and_return([HappyCheck.new, UnhappyCheck.new])

    get :index

    expect(response).to have_http_status 503
  end
end

class HappyCheck < StatusCheck
  def _status_description
    [:success, nil]
  end
end

class UnhappyCheck < StatusCheck
  def _status_description
    [:danger, "uh oh"]
  end
end

RSpec.describe "JobsCheck" do
  let(:check) { JobsCheck.new }

  let!(:dummy_job) { JobUtils::WCA_CRONJOBS.sample }
  let!(:another_job) { (JobUtils::WCA_CRONJOBS.without dummy_job).sample }

  it "passes if there are young jobs" do
    _young_job = dummy_job.cronjob_statistics.update!(enqueued_at: 1.minutes.ago)

    status, description = check.status_description

    expect(status).to eq :success
    expect(description).to be_nil
  end

  it "finds the oldest job that has been waiting to run" do
    dummy_job.cronjob_statistics.update!(enqueued_at: 10.minutes.ago)
    another_job.cronjob_statistics.update!(enqueued_at: 15.minutes.ago)

    status, description = check.status_description

    expect(status).to eq :danger
    expect(description).to match(/Job #{another_job.cronjob_statistics.id} was/)
  end

  it "ignores jobs in progress" do
    dummy_job.cronjob_statistics.update!(enqueued_at: 10.minutes.ago)
    another_job.cronjob_statistics.update!(enqueued_at: 15.minutes.ago, run_start: DateTime.current, run_end: nil)

    status, description = check.status_description

    expect(status).to eq :danger
    expect(description).to match(/Job #{dummy_job.cronjob_statistics.id} was/)
  end
end

RSpec.describe "StripeChargesCheck" do
  let(:check) { StripeChargesCheck.new }

  it "passes" do
    status, description = check.status_description
    expect(status).to eq :success
    expect(description).to be_nil
  end

  it "warns about stripe charges with status unknown" do
    StripeTransaction.create!(
      parameters: {},
      status: "unknown",
    )

    status, description = check.status_description

    expect(status).to eq :danger
    expect(description).to match("1 Stripe charge with status 'unknown'")
  end
end

RSpec.describe "RegulationsCheck" do
  let(:check) { RegulationsCheck.new }

  it "passes" do
    allow(File).to receive(:read).with(any_args).and_call_original
    allow(File).to receive(:read).with(Regulation::REGULATIONS_JSON_PATH).and_return("{}")
    Regulation.reload_regulations

    status, description = check.status_description
    expect(status).to eq :success
    expect(description).to be_nil
  end

  it "warns about missing regulations" do
    allow(File).to receive(:read).with(any_args).and_call_original
    allow(File).to receive(:read).with(Regulation::REGULATIONS_JSON_PATH).and_raise(Errno::ENOENT.new)
    Regulation.reload_regulations

    status, description = check.status_description

    expect(status).to eq :danger
    expect(description).to eq "Error while loading regulations: No such file or directory"
  end

  it "warns about malformed regulations" do
    allow(File).to receive(:read).with(any_args).and_call_original
    allow(File).to receive(:read).with(Regulation::REGULATIONS_JSON_PATH).and_return("i am definitely not json")
    Regulation.reload_regulations

    status, description = check.status_description

    expect(status).to eq :danger
    # The \d reference is a line number in the external `json` gem which might change every now and then.
    # We want to avoid having to change our tests whenever that library updates.
    expect(description).to match(/Error while loading regulations: unexpected token at 'i am definitely not json'/)
  end
end
