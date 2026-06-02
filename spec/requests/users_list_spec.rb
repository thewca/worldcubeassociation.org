# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Users list" do
  it "renders the users index with the React on Rails mount" do
    sign_in FactoryBot.create(:admin)

    get "/users"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("UsersList")
  end
end