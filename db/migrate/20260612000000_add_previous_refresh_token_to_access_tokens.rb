# frozen_string_literal: true

# Enables Doorkeeper's "revoke refresh token on use" mode: when this column
# exists, a refresh no longer revokes the old refresh_token immediately.
# Instead the new access_token records it here, and the old token is revoked
# the first time the new access_token is used. Concurrent refresh requests
# with the same refresh_token therefore all succeed instead of racing into
# `invalid_grant`. See Doorkeeper::AccessToken.refresh_token_revoked_on_use?
class AddPreviousRefreshTokenToAccessTokens < ActiveRecord::Migration[8.1]
  def change
    add_column(
      :oauth_access_tokens,
      :previous_refresh_token,
      :string,
      default: "",
      null: false,
    )
  end
end
