# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Sign in with 2FA" do
  context 'Signing in without 2FA' do
    let(:fool) { create(:user) }

    it 'works for a fool' do
      visit "/users/sign_in"
      fill_in "Email", with: fool.email
      fill_in "user[password]", with: "wca"
      click_button "Sign in"
      expect(page).to have_content "Signed in successfully"
    end
  end

  context 'Signing in with 2FA' do
    let(:user) { create(:user, :with_2fa) }

    it 'works with an otp' do
      visit "/users/sign_in"
      fill_in "Email", with: user.email
      fill_in "user[password]", with: "wca"
      click_button "Sign in"
      expect(page).to have_content "Enter your two-factor authentication code"
      fill_in "user[otp_attempt]", with: user.current_otp
      click_button "Confirm code"
      expect(page).to have_content "Signed in successfully"
    end

    it 'works with a backup codes' do
      codes = user.generate_otp_backup_codes!
      user.save!
      visit "/users/sign_in"
      fill_in "Email", with: user.email
      fill_in "user[password]", with: "wca"
      click_button "Sign in"
      expect(page).to have_content "Enter your two-factor authentication code"
      fill_in "user[otp_attempt]", with: codes.first
      click_button "Confirm code"
      expect(page).to have_content "Signed in successfully"
    end

    it 'can send a OTP by email', :js do
      visit "/users/sign_in"
      fill_in "Email", with: user.email
      fill_in "user[password]", with: "wca"
      click_button "Sign in"
      expect(page).to have_content "Enter your two-factor authentication code"
      expect(TwoFactorMailer).to receive(:send_otp_to_user).with(user).and_call_original
      accept_alert("You have been sent a code by email. The code is valid for 2 minutes. You may ask for a new code in 2 minutes.") do
        click_on "Get a code by email"
      end
      # NOTE: It's pointless to check the OTP here, as it's user.current_otp (tested
      # earlier). And the mailer spec makes sure the code is included in the
      # email.
    end
  end
end
