# frozen_string_literal: true
require "rails_helper"

RSpec.describe "users" do
  include Capybara::DSL

  it 'can sign up and request confirmation' do
    user = FactoryGirl.build :user

    post user_registration_path, params: {
      'user[email]' => user.email,
      'user[name]' => user.name,
      'user[password]' => user.password,
      'user[password_confirmation]' => user.password,
    }
    follow_redirect!
    expect(response).to be_success

    post user_confirmation_path, params: { 'user[email]' => user.email }
    follow_redirect!
    expect(response).to be_success
    expect(response.body).to include(I18n.t('devise.confirmations.send_instructions'))
  end

  it 'can change password' do
    user = FactoryGirl.create :user

    # sign in
    post user_session_path, params: { 'user[login]' => user.email, 'user[password]' => user.password }
    follow_redirect!
    expect(response).to be_success
    get profile_edit_path
    expect(response).to be_success

    new_password = 'new_password'
    put user_path(user), params: { 'user[email]' => user.email, 'user[password]' => new_password, 'user[password_confirmation]' => new_password, 'user[current_password]' => user.password }
    follow_redirect!
    expect(response).to be_success

    # sign out
    delete destroy_user_session_path
    get profile_edit_path
    expect(response).to redirect_to new_user_session_path

    # sign in with new password
    post user_session_path, params: { 'user[login]' => user.email, 'user[password]' => new_password }
    follow_redirect!
    get profile_edit_path
    expect(response).to be_success
  end

  it 'sign in shows conversion message for competitors missing accounts' do
    person = FactoryGirl.create :person

    # attempt to sign in
    post user_session_path, params: { 'user[login]' => person.wca_id, 'user[password]' => "a password" }
    expect(response).to be_success
    expect(response.body).to include "It looks like you have not created a WCA website account yet"
  end

  it 'reset password shows conversion message for competitors missing accounts' do
    person = FactoryGirl.create :person

    # attempt to reset password
    post user_password_path, params: { 'user[login]' => person.wca_id, 'user[password]' => "a password" }
    expect(response).to be_success
    expect(response.body).to include "It looks like you have not created a WCA website account yet"
  end
end
