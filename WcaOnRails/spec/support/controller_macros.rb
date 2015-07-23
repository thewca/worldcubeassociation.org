module ControllerMacros
  def sign_in
    before :each do
      @request.env["devise.mapping"] = Devise.mappings[:user]
      sign_in yield
    end
  end
end

module RequestMacros
  def sign_in
    before :each do
      user = yield
      post_via_redirect new_user_session_path, {
        'user[login]' => user,
        'user[password]' => user,
      }
    end
  end
end

RSpec.configure do |config|
  config.extend ControllerMacros, :type => :controller
  config.extend RequestMacros, :type => :request
end
