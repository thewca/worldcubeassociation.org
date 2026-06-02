# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Static pages about" do
  it "renders the about page with the React on Rails mount" do
    get "/about"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("StaticPagesAbout")
  end
end
