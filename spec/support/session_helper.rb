# frozen_string_literal: true

module SessionHelper
  def sign_in(user)
    visit '/users/sign_in'
    fill_in 'Email or WCA ID', with: user.email
    fill_in 'Password', with: user.password
    click_button 'Sign in'
  end
end
