# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Static pages translators" do
  it "renders the translators page with the React on Rails mount" do
    get "/translators"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Translators")
  end
end
