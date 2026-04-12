# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Static pages disclaimer" do
  it "renders the disclaimer with the React on Rails mount" do
    get "/disclaimer"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("StaticPagesDisclaimer")
    expect(response.body).to include("Disclaimer")
  end
end
