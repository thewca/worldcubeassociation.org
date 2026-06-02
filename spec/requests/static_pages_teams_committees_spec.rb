# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Static pages teams and committees" do
  it "renders the teams and committees page with the React on Rails mount" do
    get "/teams-committees"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("TeamsCommitteesCouncils")
  end
end