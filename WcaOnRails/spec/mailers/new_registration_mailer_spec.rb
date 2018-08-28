# frozen_string_literal: true

require "rails_helper"

RSpec.describe NewRegistrationMailer, type: :mailer do
  describe "send registration mail to new users" do
    let(:user) { FactoryBot.create :user }
    let(:mail) { NewRegistrationMailer.send_registration_mail(user) }

    it "renders the headers" do
      expect(mail.subject).to eq "Confirmation instructions"
      expect(mail.to).to eq [user.email]
      expect(mail.from).to eq ["notifications@worldcubeassociation.org"]
    end

    it "renders the body" do
      expect(mail.body.encoded).to match user.email
      expect(mail.body.encoded).to match "Your account is created and must be activated before you can use it."
    end
  end
end
