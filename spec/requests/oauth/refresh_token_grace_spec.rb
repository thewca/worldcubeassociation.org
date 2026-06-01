# frozen_string_literal: true

require "rails_helper"

RSpec.describe "OAuth refresh_token grace window" do
  let(:user) { create(:user_with_wca_id) }
  let(:oauth_app) { create(:oauth_application) }

  let!(:access_token) do
    Doorkeeper::AccessToken.create!(
      application: oauth_app,
      resource_owner_id: user.id,
      scopes: "public email",
      use_refresh_token: true,
    )
  end

  let(:refresh_params) do
    {
      grant_type: "refresh_token",
      client_id: oauth_app.uid,
      client_secret: oauth_app.secret,
      refresh_token: access_token.refresh_token,
    }
  end

  def post_refresh(refresh_token)
    post oauth_token_path, params: {
      grant_type: "refresh_token",
      client_id: oauth_app.uid,
      client_secret: oauth_app.secret,
      refresh_token: refresh_token,
    }
    response.parsed_body
  end

  it "issues a new token on the first refresh and records previous_refresh_token" do
    original_refresh = access_token.refresh_token

    body = post_refresh(original_refresh)

    expect(response).to be_successful
    expect(body["error"]).to be_nil
    expect(body["access_token"]).to be_present

    new_token = Doorkeeper::AccessToken.by_token(body["access_token"])
    expect(new_token.previous_refresh_token).to eq(original_refresh)
    expect(access_token.reload).to be_revoked
  end

  it "returns the winner's token when a concurrent caller replays the stale refresh_token inside the grace window" do
    original_refresh = access_token.refresh_token

    winner = post_refresh(original_refresh)
    expect(response).to be_successful

    loser = post_refresh(original_refresh)
    expect(response).to be_successful
    expect(loser["error"]).to be_nil
    expect(loser["access_token"]).to eq(winner["access_token"])
    expect(loser["refresh_token"]).to eq(winner["refresh_token"])

    # Only one new access_token row should have been created across both calls.
    rotations = Doorkeeper::AccessToken.where(previous_refresh_token: original_refresh)
    expect(rotations.count).to eq(1)
  end

  it "rejects a replay after the grace window has closed" do
    original_refresh = access_token.refresh_token
    post_refresh(original_refresh)
    expect(response).to be_successful

    travel_to(DoorkeeperRefreshTokenGrace::GRACE_PERIOD.from_now + 1.second) do
      body = post_refresh(original_refresh)
      expect(response).not_to be_successful
      expect(body["error"]).to eq("invalid_grant")
    end
  end

  it "rejects a replay after the replacement has itself been rotated (reuse detection)" do
    original_refresh = access_token.refresh_token

    winner = post_refresh(original_refresh)
    expect(response).to be_successful

    # Rotate the replacement so it is no longer a valid grace target.
    second = post_refresh(winner["refresh_token"])
    expect(response).to be_successful
    expect(second["access_token"]).not_to eq(winner["access_token"])

    body = post_refresh(original_refresh)
    expect(response).not_to be_successful
    expect(body["error"]).to eq("invalid_grant")
  end
end