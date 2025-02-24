# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Basic Test", js: true do
  it "visits the home page" do
    visit '/'
    expect(page).to have_content("Welcome")
  end
end
