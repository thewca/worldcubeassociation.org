# frozen_string_literal: true

require "rails_helper"

RSpec.describe WcaMonthlyDigestMailer do
  describe "send_weat_digest_content" do
    let(:mail) { WcaMonthlyDigestMailer.send_weat_digest_content }

    it "renders the headers" do
      last_month = 1.month.ago.beginning_of_month
      expect(mail.to).to eq(["assistants@worldcubeassociation.org"])
      expect(mail.reply_to).to eq(["assistants@worldcubeassociation.org"])
      expect(mail.subject).to eq("WCA Monthly Digest Draft - #{last_month.strftime('%B %Y')}")
    end

    it "renders every digest section, starting with the delegate milestones" do
      section_titles = [
        "Delegate Milestones",
        "Committee/Team Leaders",
        "New Senior Delegates",
        "New Regional Delegates",
        "New Trainee Delegates",
        "New Junior Delegates",
        "Delegate Promotions: Trainee Delegate to Junior Delegate",
        "Delegate Promotions: Junior Delegate to Delegate",
        "Delegate Resignations/Demotions",
        "New Committee/Team Members",
        "Promoted Committee/Team Members",
        "Resigned/Demoted Committee/Team Members",
        "Recognized Regional Organizations",
      ]
      section_positions = section_titles.map { |title| mail.body.encoded.index("<b>#{title}</b>") }

      expect(section_positions).to all(be_present)
      expect(section_positions).to eq section_positions.sort
    end
  end
end
