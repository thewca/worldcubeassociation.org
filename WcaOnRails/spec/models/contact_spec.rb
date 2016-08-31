# frozen_string_literal: true
require 'rails_helper'

describe Contact do
  it "should be valid" do
    expect(FactoryGirl.build :contact).to be_valid
  end

  it "your_email must be present" do
    expect(FactoryGirl.build :contact, your_email: "").not_to be_valid
  end

  it "your_email must be valid" do
    expect(FactoryGirl.build :contact, your_email: "foo").not_to be_valid
  end

  it "to_email must be present" do
    expect(FactoryGirl.build :contact, to_email: "").not_to be_valid
  end

  it "to_email must be valid" do
    expect(FactoryGirl.build :contact, to_email: "foo").not_to be_valid
  end
end
