module ControllerMacros
  def login_admin
    before :each do
      @request.env["devise.mapping"] = Devise.mappings[:admin]
      sign_in FactoryGirl.create(:admin)
    end
  end
end

RSpec.configure do |config|
  config.extend ControllerMacros, :type => :controller
end
