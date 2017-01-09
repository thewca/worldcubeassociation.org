# frozen_string_literal: true
require "rails_helper"

RSpec.describe AvatarsMailer, type: :mailer do
  describe "notify_user_of_avatar_rejection" do
    let(:user) { FactoryGirl.create :user, name: "Sherlock Holmes" }
    let(:rejection_reason) { "The avatar must not include texts other than regular background texts." }
    let(:mail) { AvatarsMailer.notify_user_of_avatar_rejection(user, rejection_reason) }

    it "renders the headers" do
      expect(mail.subject).to eq "Your avatar has been rejected"
      expect(mail.to).to eq [user.email]
      expect(mail.reply_to).to eq ["results@worldcubeassociation.org"]
      expect(mail.from).to eq ["notifications@worldcubeassociation.org"]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match user.name
      expect(mail.body.encoded).to match rejection_reason
    end
  end
end
