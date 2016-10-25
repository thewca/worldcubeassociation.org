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

  def redirects_to_sign_in_page
    it "redirects to sign in page" do
      expect(response).to redirect_to new_user_session_url
    end
  end

  def redirects_to_root_url
    it "redirects to root url" do
      expect(response).to redirect_to root_url
    end
  end
end

module RequestMacros
  def sign_in
    before :each do
      user = yield
      post_via_redirect new_user_session_path, {
        'user[login]' => user.email,
        'user[password]' => user.password,
      }
    end
  end
end

RSpec.configure do |config|
  config.extend ControllerMacros, type: :controller
  config.extend RequestMacros, type: :request
end
