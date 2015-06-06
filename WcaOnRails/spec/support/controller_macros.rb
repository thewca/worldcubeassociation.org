module ControllerMacros
  def login_admin
    before :each do
      @request.env["devise.mapping"] = Devise.mappings[:admin]
      sign_in FactoryGirl.create(:admin)
    end
  end
end

module RequestMacros
  def sign_in(user)
  end

  def login_admin
    before :each do
      user = FactoryGirl.create(:admin)
      post_via_redirect new_user_session_path, {
        'user[login]' => user.email,
        'user[password]' => user.password,
      }
    end
  end
end

RSpec.configure do |config|
  config.extend ControllerMacros, :type => :controller
  config.extend RequestMacros, :type => :request
end
