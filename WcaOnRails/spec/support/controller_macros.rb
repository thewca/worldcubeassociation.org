# frozen_string_literal: true

module ControllerMacros
  def sign_in
    before :each do
      @request.env["devise.mapping"] = Devise.mappings[:user]
      sign_in yield
    end
  end

  def sign_out
    before :each do
      sign_out :user
    end
  end
end

module RequestMacros
  def sign_in
    before :each do
      user = yield
      post new_user_session_path, params: {
        'user[login]' => user.email,
        'user[password]' => user.password,
      }
      follow_redirect!
    end
  end

  def sign_out
    before :each do
      delete destroy_user_session_path
      follow_redirect!
    end
  end
end

RSpec.configure do |config|
  config.extend ControllerMacros, type: :controller
  config.extend RequestMacros, type: :request
end
