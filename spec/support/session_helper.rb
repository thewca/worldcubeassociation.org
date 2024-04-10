# frozen_string_literal: true

DEFAULT_PASSWORD = 'wca'

module SessionHelper
  def sign_in(user)
    visit "/users/sign_in"
    fill_in "Email or WCA ID", with: user.email
    fill_in "Password", with: DEFAULT_PASSWORD # Maybe later change to user.password || DEFAULT_PASSWORD.
    click_button "Sign in"
  end
end
