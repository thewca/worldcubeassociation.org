# frozen_string_literal: true
require "rails_helper"

RSpec.describe "users" do
  include Capybara::DSL

  it 'can sign up and request confirmation' do
    user = FactoryGirl.build :user

    post_via_redirect user_registration_path, {
      'user[email]' => user.email,
      'user[name]' => user.name,
      'user[password]' => user.password,
      'user[password_confirmation]' => user.password,
    }
    expect(response).to be_success

    post_via_redirect user_confirmation_path, 'user[email]' => user.email
    expect(response).to be_success
    expect(response.body).to include(I18n.t('devise.confirmations.send_instructions'))
  end

  it 'can change password' do
    user = FactoryGirl.create :user

    # sign in
    post_via_redirect user_session_path, 'user[login]' => user.email, 'user[password]' => user.password
    expect(response).to be_success
    get profile_edit_path
    expect(response).to be_success

    new_password = 'new_password'
    put_via_redirect user_path(user), 'user[email]' => user.email, 'user[password]' => new_password, 'user[password_confirmation]' => new_password, 'user[current_password]' => user.password
    expect(response).to be_success

    # sign out
    delete destroy_user_session_path
    get profile_edit_path
    expect(response).to redirect_to new_user_session_path

    # sign in with new password
    post_via_redirect user_session_path, 'user[login]' => user.email, 'user[password]' => new_password
    get profile_edit_path
    expect(response).to be_success
  end

  it 'sign in shows conversion message for competitors missing accounts' do
    person = FactoryGirl.create :person

    # attempt to sign in
    post_via_redirect user_session_path, 'user[login]' => person.wca_id, 'user[password]' => "a password"
    expect(response).to be_success
    expect(response.body).to include "It looks like you have not created a WCA website account yet"
  end

  it 'reset password shows conversion message for competitors missing accounts' do
    person = FactoryGirl.create :person

    # attempt to reset password
    post_via_redirect user_password_path, 'user[login]' => person.wca_id, 'user[password]' => "a password"
    expect(response).to be_success
    expect(response.body).to include "It looks like you have not created a WCA website account yet"
  end
end
