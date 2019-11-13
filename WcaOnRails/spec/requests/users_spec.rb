# frozen_string_literal: true

require "rails_helper"

RSpec.describe "users" do
  include Capybara::DSL

  it 'can sign up and request confirmation' do
    user = FactoryBot.build :user

    post user_registration_path, params: {
      'user[email]' => user.email,
      'user[name]' => user.name,
      'user[password]' => user.password,
      'user[password_confirmation]' => user.password,
    }
    follow_redirect!
    expect(response).to be_successful

    post user_confirmation_path, params: { 'user[email]' => user.email }
    follow_redirect!
    expect(response).to be_successful
    expect(response.body).to include(I18n.t('devise.confirmations.send_instructions'))
  end

  it 'can change password' do
    user = FactoryBot.create :user

    # sign in
    post user_session_path, params: { 'user[login]' => user.email, 'user[password]' => user.password }
    follow_redirect!
    expect(response).to be_successful
    get profile_edit_path
    expect(response).to be_successful

    new_password = 'new_password'
    put user_path(user), params: { 'user[email]' => user.email, 'user[password]' => new_password, 'user[password_confirmation]' => new_password, 'user[current_password]' => user.password }
    follow_redirect!
    expect(response).to be_successful

    # sign out
    delete destroy_user_session_path
    get profile_edit_path
    expect(response).to redirect_to new_user_session_path

    # sign in with new password
    post user_session_path, params: { 'user[login]' => user.email, 'user[password]' => new_password }
    follow_redirect!
    get profile_edit_path
    expect(response).to be_successful
  end

  it 'sign in shows conversion message for competitors missing accounts' do
    person = FactoryBot.create :person

    # attempt to sign in
    post user_session_path, params: { 'user[login]' => person.wca_id, 'user[password]' => "a password" }
    expect(response).to be_successful
    expect(response.body).to include "It looks like you have not created a WCA website account yet"
  end

  it 'reset password shows conversion message for competitors missing accounts' do
    person = FactoryBot.create :person

    # attempt to reset password
    post user_password_path, params: { 'user[login]' => person.wca_id, 'user[password]' => "a password" }
    expect(response).to be_successful
    expect(response.body).to include "It looks like you have not created a WCA website account yet"
  end

  context "user without 2FA" do
    let(:user) { FactoryBot.create(:user) }
    before { sign_in user }

    it 'can enable 2FA' do
      post profile_enable_2fa_path
      expect(response.body).to include "Successfully enabled two-factor"
      expect(user.reload.otp_required_for_login).to be true
    end

    it 'does not generate backup codes for user without 2FA' do
      expect {
        post profile_generate_2fa_backup_path
      }.to_not change { user.otp_backup_codes }
      json = JSON.parse(response.body)
      expect(json["error"]["message"]).to include "not enabled"
    end
  end

  context "user with 2FA" do
    let(:user) { FactoryBot.create(:user, :with_2fa) }
    before { sign_in user }

    it 'can reset 2FA' do
      expect {
        post profile_enable_2fa_path
      }.to change { user.otp_secret }
      expect(response.body).to include "Successfully regenerated"
    end

    it 'can (re)generate backup codes for user with 2FA' do
      expect {
        post profile_generate_2fa_backup_path
      }.to change { user.otp_backup_codes }
      json = JSON.parse(response.body)
      expect(json["codes"]&.size).to eq User::NUMBER_OF_BACKUP_CODES
    end
  end
end
