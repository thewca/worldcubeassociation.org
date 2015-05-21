require 'rails_helper'

describe Post do
  it "has a valid factory" do
    expect(FactoryGirl.create :post).to be_valid
  end
end
