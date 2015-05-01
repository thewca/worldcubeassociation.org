require 'rails_helper'

describe Node do
  it "has a valid factory" do
    expect(FactoryGirl.create :node).to be_valid
  end
end
