# frozen_string_literal: true

class AddDangerouslyAllowAnyRedirectUriToOauthApplications < ActiveRecord::Migration[5.1]
  def change
    add_column :oauth_applications, :dangerously_allow_any_redirect_uri, :boolean, null: false, default: false
  end
end
