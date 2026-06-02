# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Results records" do
  it "renders the records page with the React on Rails mount" do
    get "/results/records"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("ResultsRecords")
  end
end