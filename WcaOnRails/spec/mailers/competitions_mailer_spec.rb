require "rails_helper"

RSpec.describe CompetitionsMailer, type: :mailer do
  describe "notify_board_of_confirmed_competition" do
    let(:delegate) { FactoryGirl.create :delegate }
    let(:competition) { FactoryGirl.create :competition, delegates: [delegate] }
    let(:mail) { CompetitionsMailer.notify_board_of_confirmed_competition(delegate, competition) }

    it "renders" do
      expect(mail.to).to eq(["board@worldcubeassociation.org"])
      expect(mail.cc).to eq([delegate.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.reply_to).to eq([delegate.email])

      expect(mail.subject).to eq("#{delegate.name} just confirmed #{competition.name}")
      expect(mail.body.encoded).to match("#{competition.name} is confirmed")
      expect(mail.body.encoded).to match(admin_edit_competition_url(competition))
    end
  end
end
