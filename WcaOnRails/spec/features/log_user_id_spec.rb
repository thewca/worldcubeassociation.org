require "rails_helper"

RSpec.feature "log user id" do
  before :each do
    allow(Rails.logger).to receive(:info).and_call_original
  end

  context "not logged in" do
    before :each do
      expect_logger_to_log("[User Id] Request was made by user id: <not logged in>")
    end

    it "logs the not logged in user" do
      visit root_path
    end
  end

  context "logged in" do
    let(:admin) { FactoryGirl.create :admin }

    before :each do
      sign_in admin

      expect_logger_to_log("[User Id] Request was made by user id: #{admin.id}")
    end

    it "logs the current user" do
      visit root_path
    end
  end

  def expect_logger_to_log(message)
    expect(Rails.logger).to receive(:info).
                            at_least(:once).
                            with(message).
                            and_call_original
  end
end
