# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Static pages officers and board" do
  it "renders the officers and board page with the React on Rails mount" do
    get "/officers-and-board"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("OfficersAndBoard")
  end
end
