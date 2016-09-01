# frozen_string_literal: true
require 'rails_helper'

RSpec.describe WikiPage, type: :model do
  it "has valid factory" do
    expect(FactoryGirl.build(:wiki_page)).to be_valid
  end
end
