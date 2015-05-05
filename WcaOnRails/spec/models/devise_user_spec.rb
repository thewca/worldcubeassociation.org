require 'rails_helper'

RSpec.describe DeviseUser, type: :model do
  it "defines a valid user" do
    user = FactoryGirl.create :devise_user
    expect(user).to be_valid
  end
end
