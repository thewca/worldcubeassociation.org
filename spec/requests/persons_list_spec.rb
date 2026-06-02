# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Persons list" do
  it "renders the persons index with the React on Rails mount" do
    get "/persons"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("PersonsList")
  end
end