require "rails_helper"

RSpec.describe CompetitionsMailer, type: :mailer do
  describe "notify_board_of_newly_confirmed_competition" do
    let(:mail) { CompetitionsMailer.notify_board_of_newly_confirmed_competition }

    it "renders the headers" do
      expect(mail.subject).to eq("Notify board of newly confirmed competition")
      expect(mail.to).to eq(["to@example.org"])
      expect(mail.from).to eq(["from@example.com"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Hi")
    end
  end
end
