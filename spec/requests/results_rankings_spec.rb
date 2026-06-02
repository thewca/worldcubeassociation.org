# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Results rankings" do
  it "renders the rankings page with the React on Rails mount" do
    get "/results/rankings/333/single"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("ResultsRankings")
  end
end