# frozen_string_literal: true

require "rails_helper"

RSpec.describe WcaMonthlyDigestMailer, type: :mailer do
  describe "send_weat_digest_content" do
    let(:mail) { WcaMonthlyDigestMailer.send_weat_digest_content }

    it "renders the headers" do
      expect(mail.to).to eq(["assistants@worldcubeassociation.org"])
      expect(mail.reply_to).to eq(["assistants@worldcubeassociation.org"])
      expect(mail.subject).to eq("WCA Monthly Digest Draft")
    end
  end
end
