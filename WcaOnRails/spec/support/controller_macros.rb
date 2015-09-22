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
