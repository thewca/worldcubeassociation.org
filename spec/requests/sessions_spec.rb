# frozen_string_literal: true

require "rails_helper"

RSpec.describe "sessions" do
  it "keeps other devices remembered after signing out" do
    user = create(:user)
    phone = ActionDispatch::Integration::Session.new(Rails.application)
    laptop = ActionDispatch::Integration::Session.new(Rails.application)
    sign_in_params = {
      user: {
        login: user.email,
        password: user.password,
        remember_me: "1",
      },
    }

    phone.post(user_session_path, params: sign_in_params)
    laptop.post(user_session_path, params: sign_in_params)

    expect(phone.cookies["remember_user_token"]).to be_present
    expect(laptop.cookies["remember_user_token"]).to be_present

    phone.delete(destroy_user_session_path)
    laptop.cookies.delete("_WcaOnRails_session")
    laptop.get(profile_edit_path)

    expect(laptop.response).to be_successful
  end
end
