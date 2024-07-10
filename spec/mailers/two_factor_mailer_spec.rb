# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TwoFactorMailer, type: :mailer do
  describe 'send_otp_to_user' do
    let(:user) { FactoryBot.create(:user, :with_2fa) }
    let(:mail) { TwoFactorMailer.send_otp_to_user(user) }

    it 'renders' do
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(['software@worldcubeassociation.org'])
      expect(mail.reply_to).to eq(mail.from)

      expect(mail.subject).to eq('Your one-time password for the WCA')
      expect(mail.body.encoded).to match(user.current_otp)
    end
  end
end
