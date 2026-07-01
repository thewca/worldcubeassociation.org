# frozen_string_literal: true

require "rails_helper"

# Doorkeeper's "revoke refresh token on use" mode (enabled by the
# `previous_refresh_token` column on oauth_access_tokens): refreshing does not
# immediately revoke the old refresh_token, so concurrent refresh requests all
# succeed. The old refresh_token is revoked the first time a replacement
# access_token is actually used.
RSpec.describe "OAuth refresh_token rotation" do
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

  def post_refresh(refresh_token)
    post oauth_token_path, params: {
      grant_type: "refresh_token",
      client_id: oauth_app.uid,
      client_secret: oauth_app.secret,
      refresh_token: refresh_token,
    }
    response.parsed_body
  end

  def use_access_token(token)
    get "/api/v0/me", headers: { "Authorization" => "Bearer #{token}" }
  end

  it "issues a new token pair without immediately revoking the old refresh_token" do
    original_refresh = access_token.refresh_token

    body = post_refresh(original_refresh)

    expect(response).to be_successful
    expect(body["error"]).to be_nil
    expect(body["access_token"]).to be_present
    expect(body["refresh_token"]).not_to eq(original_refresh)

    new_token = Doorkeeper::AccessToken.by_token(body["access_token"])
    expect(new_token.previous_refresh_token).to eq(original_refresh)
    expect(access_token.reload).not_to be_revoked
  end

  it "lets a concurrent caller replay the old refresh_token before the replacement is used" do
    original_refresh = access_token.refresh_token

    winner = post_refresh(original_refresh)
    expect(response).to be_successful

    loser = post_refresh(original_refresh)
    expect(response).to be_successful
    expect(loser["error"]).to be_nil
    expect(loser["access_token"]).to be_present
    expect(loser["access_token"]).not_to eq(winner["access_token"])

    # Both replacement pairs are valid, so whichever one the client ends up
    # persisting keeps working.
    expect(Doorkeeper::AccessToken.by_token(winner["access_token"])).not_to be_revoked
    expect(Doorkeeper::AccessToken.by_token(loser["access_token"])).not_to be_revoked
  end

  it "revokes the old refresh_token once a replacement access_token is used" do
    original_refresh = access_token.refresh_token

    winner = post_refresh(original_refresh)
    expect(response).to be_successful

    use_access_token(winner["access_token"])
    expect(response).to be_successful
    expect(access_token.reload).to be_revoked

    body = post_refresh(original_refresh)
    expect(response).not_to be_successful
    expect(body["error"]).to eq("invalid_grant")
  end

  it "keeps the replacement refresh_token usable after the old one is revoked" do
    original_refresh = access_token.refresh_token

    winner = post_refresh(original_refresh)
    use_access_token(winner["access_token"])

    second = post_refresh(winner["refresh_token"])
    expect(response).to be_successful
    expect(second["access_token"]).to be_present
    expect(second["access_token"]).not_to eq(winner["access_token"])
  end
end
