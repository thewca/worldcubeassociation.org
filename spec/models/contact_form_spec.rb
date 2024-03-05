# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ContactForm do
  it "should be valid" do
    expect(FactoryBot.build(:contact_form)).to be_valid
  end

  it "your_email must be present" do
    expect(FactoryBot.build(:contact_form, your_email: "")).not_to be_valid
  end

  it "your_email must be valid" do
    expect(FactoryBot.build(:contact_form, your_email: "foo")).not_to be_valid
  end

  it "to_email must be present" do
    expect(FactoryBot.build(:contact_form, to_email: "")).not_to be_valid
    expect(FactoryBot.build(:contact_form, to_email: [])).not_to be_valid
  end

  it "to_email must be valid" do
    expect(FactoryBot.build(:contact_form, to_email: "foo")).not_to be_valid
  end

  it "to_email may be an array" do
    expect(FactoryBot.build(:contact_form, to_email: ["foo@example.com", "bar@exmple.com"])).to be_valid
  end
end
