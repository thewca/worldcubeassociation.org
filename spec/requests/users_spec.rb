# frozen_string_literal: true

require "rails_helper"

RSpec.describe "users" do
  include Capybara::DSL

  it 'can sign up and request confirmation' do
    user = build(:user)

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

  it 'cannot change password when not recently authenticated' do
    user = create(:user)

    # Using sign_in here instead of the post action, as it does *not* trigger setting the
    # recently_authenticated_at session variable.
    sign_in user
    get profile_edit_path
    expect(response).to be_successful

    new_password = 'new_password'
    put user_path(user), params: { 'user[email]' => user.email, 'user[password]' => new_password, 'user[password_confirmation]' => new_password }
    follow_redirect!
    expect(response.body).to include(I18n.t('users.edit.sensitive.identity_error'))
  end

  it 'can change password' do
    user = create(:user)

    # sign in
    post user_session_path, params: { 'user[login]' => user.email, 'user[password]' => user.password }
    follow_redirect!
    expect(response).to be_successful
    get profile_edit_path
    expect(response).to be_successful

    # confirm identity
    post users_authenticate_sensitive_path, params: { 'user[password]' => user.password }
    follow_redirect!
    expect(response.body).to include(I18n.t('users.edit.sensitive.success'))

    # set password
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
    person = create(:person)

    # attempt to sign in
    post user_session_path, params: { 'user[login]' => person.wca_id, 'user[password]' => "a password" }
    expect(response).to be_successful
    expect(response.body).to include "It looks like you have not created a WCA website account yet"
  end

  it 'reset password shows conversion message for competitors missing accounts' do
    person = create(:person)

    # attempt to reset password
    post user_password_path, params: { 'user[login]' => person.wca_id, 'user[password]' => "a password" }
    expect(response).to be_successful
    expect(response.body).to include "It looks like you have not created a WCA website account yet"
  end

  context "user without 2FA" do
    let!(:user) { create(:user) }

    before { sign_in user }

    context "recently authenticated" do
      before { post users_authenticate_sensitive_path, params: { 'user[password]': user.password } }

      it 'can enable 2FA' do
        post profile_enable_2fa_path
        expect(response.body).to include "Successfully enabled two-factor"
        expect(user.reload.otp_required_for_login).to be true
      end

      it 'does not generate backup codes for user without 2FA' do
        expect do
          post profile_generate_2fa_backup_path
        end.not_to change(user, :otp_backup_codes)
        json = response.parsed_body
        expect(json["error"]["message"]).to include "not enabled"
      end
    end

    context "not recently authenticated" do
      it 'cannot enable 2FA' do
        post profile_enable_2fa_path
        follow_redirect!
        expect(response.body).to include I18n.t('users.edit.sensitive.identity_error')
        expect(user.reload.otp_required_for_login).to be false
      end

      it 'does not generate backup codes for user without 2FA' do
        expect do
          post profile_generate_2fa_backup_path
          follow_redirect!
        end.not_to change(user, :otp_backup_codes)
        expect(response.body).to include I18n.t('users.edit.sensitive.identity_error')
      end
    end
  end

  context "user with 2FA" do
    let!(:user) { create(:user, :with_2fa) }

    before { sign_in user }

    context "recently authenticated" do
      before { post users_authenticate_sensitive_path, params: { 'user[otp_attempt]': user.current_otp } }

      it 'can reset 2FA' do
        secret_before = user.otp_secret
        post profile_enable_2fa_path
        secret_after = user.reload.otp_secret
        expect(response.body).to include "Successfully regenerated"
        expect(secret_before).not_to eq secret_after
      end

      it 'can disable 2FA' do
        post profile_disable_2fa_path
        expect(response.body).to include "Successfully disabled two-factor"
        expect(user.reload.otp_required_for_login).to be false
      end

      it 'can (re)generate backup codes for user with 2FA' do
        expect(user.otp_backup_codes).to be_nil
        post profile_generate_2fa_backup_path
        expect(user.reload.otp_backup_codes).not_to be_nil
        json = response.parsed_body
        expect(json["codes"]&.size).to eq User::NUMBER_OF_BACKUP_CODES
      end
    end
  end

  context "Discourse SSO" do
    let(:sso) { SingleSignOn.new }

    it "authenticates WCT user and validates user attributes" do
      user = create(:wct_member_role, user: create(:user_with_wca_id)).user
      sign_in user
      sso.nonce = 1234
      get "#{sso_discourse_path}?#{sso.payload}"
      expect(response.location).to match SingleSignOn.sso_url
      answer_sso = SingleSignOn.parse(query_string_from_location(response.location))
      expect(answer_sso.moderator).to be true
      expect(answer_sso.external_id).to eq user.id.to_s
      %i[name email avatar_url].each do |a|
        expect(answer_sso.send(a)).to eq user.send(a)
      end
      expect(answer_sso.add_groups).to eq "wct"
      expect(answer_sso.remove_groups).to eq((User.all_discourse_groups - ["wct"]).join(","))
      expect(answer_sso.custom_fields["wca_id"]).to match user.wca_id
    end

    it "authenticates regular user" do
      user = create(:user)
      sign_in user
      sso.nonce = 1234
      get "#{sso_discourse_path}?#{sso.payload}"
      expect(response.location).to match SingleSignOn.sso_url
      answer_sso = SingleSignOn.parse(query_string_from_location(response.location))
      expect(answer_sso.moderator).to be false
      expect(answer_sso.add_groups).to be_empty
      expect(answer_sso.remove_groups).to eq User.all_discourse_groups.join(",")
      expect(answer_sso.custom_fields["wca_id"]).to eq ""
    end

    it "authenticates admin delegate" do
      user = create(:delegate, :wst_member)
      sign_in user
      sso.nonce = 1234
      get "#{sso_discourse_path}?#{sso.payload}"
      expect(response.location).to match SingleSignOn.sso_url
      answer_sso = SingleSignOn.parse(query_string_from_location(response.location))
      # WST is not moderator by default, admin status is granted manually in
      # Discourse
      expect(answer_sso.moderator).to be false
      expect(answer_sso.add_groups).to eq "delegate,wst"
      expect(answer_sso.remove_groups).to eq((User.all_discourse_groups - %w[wst delegate]).join(","))
    end

    it "doesn't authenticate unconfirmed user" do
      user = create(:user, confirmed: false)
      sign_in user
      sso.nonce = 1234
      get "#{sso_discourse_path}?#{sso.payload}"
      expect(response).to redirect_to new_user_session_path
    end

    it 'doesnt authenticate user banned from discourse' do
      user = create(:user, :banned)
      sign_in user
      sso.nonce = 1234
      get "#{sso_discourse_path}?#{sso.payload}"
      expect(response).to redirect_to new_user_session_path
    end

    it 'redirects user with no dob to profile page' do
      user = create(:user, dob: nil)
      sign_in user
      sso.nonce = 1234
      get "#{sso_discourse_path}?#{sso.payload}"
      expect(response).to redirect_to edit_user_path(user)
    end

    it 'doesnt authenticate user under 13' do
      user = create(:user, dob: Date.today.advance(years: -13, days: 1))
      sign_in user
      sso.nonce = 1234
      get "#{sso_discourse_path}?#{sso.payload}"
      expect(response).to redirect_to new_user_session_path
    end
  end

  def query_string_from_location(location)
    location.sub(SingleSignOn.sso_url, "")
  end
end
