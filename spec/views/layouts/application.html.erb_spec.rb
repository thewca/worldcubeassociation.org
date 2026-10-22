# frozen_string_literal: true

require "rails_helper"
require "capybara/rspec"

RSpec.describe "layouts/application.html.erb" do
  # rspec-rails sets request.path by generating a route from the described view's
  # controller/action, but there is no "layouts" controller. ViewPathBuilder#path_for
  # swallows the resulting UrlGenerationError and assigns its *message* as the path,
  # which React on Rails then fails to parse when it builds its rails_context from
  # request.original_url.
  before { controller.request.path = "/" }

  describe "full_title" do
    it "renders title and does not escape apostrophes" do
      view.provide(:title, "Jeremy's awesome title")
      render
      expect(rendered).to have_title(/^Jeremy's awesome title \| World Cube Association$/)
    end
  end
end
