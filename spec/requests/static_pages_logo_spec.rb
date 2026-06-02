# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Static pages logo" do
  it "renders the logo page with the React on Rails mount" do
    get "/logo"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("StaticPagesLogo")
  end
end