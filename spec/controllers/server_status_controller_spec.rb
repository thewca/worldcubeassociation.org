# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ServerStatusController do
  it "is happy" do
    allow_any_instance_of(ServerStatusController).to receive(:checks).and_return([HappyCheck.new])

    get :index

    expect(response).to have_http_status :ok
  end

  it "can fail" do
    allow_any_instance_of(ServerStatusController).to receive(:checks).and_return([HappyCheck.new, UnhappyCheck.new])

    get :index

    expect(response).to have_http_status :service_unavailable
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

  let(:dummy_jobs) { JobUtils::WCA_CRONJOBS.sample(2) }

  before :each do
    CronjobStatistic.update_all(enqueued_at: Time.now)
  end

  it "passes if there are young jobs" do
    dummy_jobs.first.cronjob_statistics.update!(enqueued_at: 1.minute.ago)

    status, description = check.status_description

    expect(status).to eq :success
    expect(description).to be_nil
  end

  it "finds the oldest job that has been waiting to run", retry: 3 do
    dummy_job, another_job = dummy_jobs

    dummy_job.cronjob_statistics.update!(enqueued_at: 10.minutes.ago)
    another_job.cronjob_statistics.update!(enqueued_at: 15.minutes.ago)

    status, description = check.status_description

    expect(status).to eq :danger
    expect(description).to match(/Job #{another_job.cronjob_statistics.id} was/)
  end

  it "ignores jobs in progress", retry: 3 do
    dummy_job, another_job = dummy_jobs

    dummy_job.cronjob_statistics.update!(enqueued_at: 10.minutes.ago)
    another_job.cronjob_statistics.update!(enqueued_at: 15.minutes.ago, run_start: DateTime.current, run_end: nil)

    status, description = check.status_description

    expect(status).to eq :danger
    expect(description).to match(/Job #{dummy_job.cronjob_statistics.id} was/)
  end
end

RSpec.describe "RegulationsCheck" do
  let(:check) { RegulationsCheck.new }
  let(:s3) { Aws::S3::Client.new(stub_responses: true) }

  it "passes" do
    s3.stub_responses(:get_object, ->(_) { { body: "{}" } })
    Regulation.reload_regulations(Aws::S3::Resource.new(client: s3))

    status, description = check.status_description
    expect(status).to eq :success
    expect(description).to be_nil
  end

  it "warns about missing regulations" do
    s3.stub_responses(:get_object, ->(_) { "NoSuchKey" })
    Regulation.reload_regulations(Aws::S3::Resource.new(client: s3))

    status, description = check.status_description

    expect(status).to eq :danger
    expect(description).to eq "Error while loading regulations: stubbed-response-error-message from Aws::S3::Errors::NoSuchKey"
  end

  it "warns about malformed regulations" do
    s3.stub_responses(:get_object, ->(_) { { body: "i am definitely not json" } })
    Regulation.reload_regulations(Aws::S3::Resource.new(client: s3))

    status, description = check.status_description

    expect(status).to eq :danger
    expect(description).to match(/Error while loading regulations: unexpected character: 'i' at line 1 column 1 from JSON::ParserError/)
  end
end
