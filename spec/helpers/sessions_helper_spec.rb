# frozen_string_literal: true

require "rails_helper"

RSpec.describe SessionsHelper do
  describe "#auth_page_theme" do
    it "follows an explicit colour mode from the Next frontend's cookie" do
      helper.request.cookies[:theme] = "dark"
      expect(helper.auth_page_theme).to eq "dark"
    end

    it "leaves the system preference to the browser" do
      helper.request.cookies[:theme] = "system"
      expect(helper.auth_page_theme).to be_nil
    end

    it "ignores values it does not know" do
      helper.request.cookies[:theme] = "purple"
      expect(helper.auth_page_theme).to be_nil
    end
  end

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
