# frozen_string_literal: true

require "rails_helper"

RSpec.describe WcaMonthlyDigestMailer do
  describe "send_weat_digest_content" do
    let(:mail) { WcaMonthlyDigestMailer.send_weat_digest_content }

    it "renders the headers" do
      last_month = Time.now.beginning_of_month - 1.month
      expect(mail.to).to eq(["assistants@worldcubeassociation.org"])
      expect(mail.reply_to).to eq(["assistants@worldcubeassociation.org"])
      expect(mail.subject).to eq("WCA Monthly Digest Draft - #{last_month.strftime('%B %Y')}")
    end

    it "renders the changes in teams/committees section" do
      expect(mail.body.encoded).to include("Changes in Teams/Committees")
    end

    it "renders the delegate milestones section" do
      expect(mail.body.encoded).to include("Delegate Milestones")
    end
  end
end
