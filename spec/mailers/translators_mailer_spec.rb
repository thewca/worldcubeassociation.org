# frozen_string_literal: true

require "rails_helper"

RSpec.describe TranslatorsMailer, type: :mailer do
  describe "notify_translators_of_changes" do
    let(:mail) { TranslatorsMailer.notify_translators_of_changes }

    it "renders the headers" do
      expect(mail.to).to eq(["translators@worldcubeassociation.org"])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(mail.reply_to).to eq(["software@worldcubeassociation.org"])
      expect(mail.subject).to eq("There is new stuff awaiting translation")
    end
  end
end
