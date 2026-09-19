# frozen_string_literal: true

require "rails_helper"

RSpec.describe SessionsHelper do
  describe "#staging_oauth_login?" do
    it "is off anywhere that is not staging" do
      expect(helper.staging_oauth_login?).to be(false)
    end

    context "on staging" do
      before do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))
        allow(EnvConfig).to receive(:WCA_LIVE_SITE?).and_return(false)
      end

      it "is on until the setting says otherwise" do
        expect(helper.staging_oauth_login?).to be(true)
      end

      it "is off once the setting is written as false" do
        ServerSetting.create!(name: ServerSetting::STAGING_OAUTH_LOGIN, value: 'false')
        expect(helper.staging_oauth_login?).to be(false)
      end
    end

    it "stays off on the live site even with the setting on" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))
      allow(EnvConfig).to receive(:WCA_LIVE_SITE?).and_return(true)
      ServerSetting.create!(name: ServerSetting::STAGING_OAUTH_LOGIN, value: 'true')

      expect(helper.staging_oauth_login?).to be(false)
    end
  end
end
