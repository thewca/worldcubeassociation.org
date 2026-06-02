# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Static pages delegates" do
  it "renders the delegates page with the React on Rails mount" do
    get "/delegates"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Delegates")
  end
end
