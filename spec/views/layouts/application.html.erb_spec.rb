# frozen_string_literal: true

require "rails_helper"
require "capybara/rspec"

RSpec.describe "layouts/application.html.erb" do
  before do
    view.extend Starburst::AnnouncementsHelper
  end

  describe "full_title" do
    it "renders title and does not escape apostrophes" do
      view.provide(:title, "Jeremy's awesome title")
      render
      expect(rendered).to have_title(/^Jeremy's awesome title \| World Cube Association$/)
    end
  end
end
