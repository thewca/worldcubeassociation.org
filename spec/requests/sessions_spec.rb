# frozen_string_literal: true

require "rails_helper"

RSpec.describe "sessions" do
  def sign_in_params(user)
    {
      user: {
        login: user.email,
        password: user.password,
        remember_me: "1",
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

    freeze_time do
      browser.post(user_session_path, params: sign_in_params(user))
      original_remember_cookie = browser.cookies["remember_user_token"]
      browser.cookies.delete("_WcaOnRails_session")

      travel 1.week
      browser.get(profile_edit_path)
      expect(browser.response).to be_successful
      expect(browser.cookies["remember_user_token"]).not_to eq(original_remember_cookie)

      browser.cookies.delete("_WcaOnRails_session")

      travel 13.days
      browser.get(profile_edit_path)
      expect(browser.response).to be_successful
    end
  end
end
