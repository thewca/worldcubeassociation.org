# frozen_string_literal: true

module SignInMacros
  def sign_in
    before :each do
      sign_in yield
    end
  end

  def sign_out
    before :each do
      sign_out :user
    end
  end
end

RSpec.configure do |config|
  config.extend SignInMacros, type: :controller
  config.extend SignInMacros, type: :request
end
