# frozen_string_literal: true

require "rails_helper"

RSpec.describe "sessions" do
  def sign_in_params(user, remember_me: true)
    {
      user: {
        login: user.email,
        password: user.password,
        remember_me: remember_me ? "1" : "0",
      },
    }
  end

  it "keeps other devices remembered after signing out" do
    user = create(:user)
    phone = ActionDispatch::Integration::Session.new(Rails.application)
    laptop = ActionDispatch::Integration::Session.new(Rails.application)

    phone.post(user_session_path, params: sign_in_params(user))
    laptop.post(user_session_path, params: sign_in_params(user))

    expect(phone.cookies["remember_user_token"]).to be_present
    expect(laptop.cookies["remember_user_token"]).to be_present

    phone.delete(destroy_user_session_path)
    laptop.cookies.delete("_WcaOnRails_session")
    laptop.get(profile_edit_path)

    expect(laptop.response).to be_successful
  end

  it "refreshes the remember period when a cookie restores the session" do
    user = create(:user)
    browser = ActionDispatch::Integration::Session.new(Rails.application)
    signed_in_at = Time.current

    browser.post(user_session_path, params: sign_in_params(user))
    original_remember_cookie = browser.cookies["remember_user_token"]
    browser.cookies.delete("_WcaOnRails_session")

    travel_to(signed_in_at + 1.week) do
      browser.get(profile_edit_path)
      expect(browser.response).to be_successful
      expect(browser.cookies["remember_user_token"]).not_to eq(original_remember_cookie)
    end

    browser.cookies.delete("_WcaOnRails_session")

    travel_to(signed_in_at + 20.days) do
      browser.get(profile_edit_path)
      expect(browser.response).to be_successful
    end
  end

  it "expires an active session after the absolute timeout" do
    user = create(:user)
    browser = ActionDispatch::Integration::Session.new(Rails.application)
    signed_in_at = Time.current

    browser.post(user_session_path, params: sign_in_params(user, remember_me: false))

    travel_to(signed_in_at + User::ABSOLUTE_SESSION_TIMEOUT - 1.second) do
      browser.get(profile_edit_path)
      expect(browser.response).to be_successful
    end

    travel_to(signed_in_at + User::ABSOLUTE_SESSION_TIMEOUT + 1.second) do
      browser.get(profile_edit_path)
      expect(browser.response).to redirect_to(new_user_session_path)
    end
  end

  it "expires a rolling remembered session after the absolute timeout" do
    user = create(:user)
    browser = ActionDispatch::Integration::Session.new(Rails.application)
    signed_in_at = Time.current

    browser.post(user_session_path, params: sign_in_params(user))

    12.times do |week|
      browser.cookies.delete("_WcaOnRails_session")

      travel_to(signed_in_at + (week + 1).weeks) do
        browser.get(profile_edit_path)
        expect(browser.response).to be_successful
      end
    end

    browser.cookies.delete("_WcaOnRails_session")

    travel_to(signed_in_at + 13.weeks) do
      browser.get(profile_edit_path)
      expect(browser.response).to redirect_to(new_user_session_path)
    end
  end
end
