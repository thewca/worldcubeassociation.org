# frozen_string_literal: true

require "rails_helper"

RSpec.describe "sessions" do
  describe "GET #destroy_from_next" do
    let(:user) { create(:user) }
    let(:access_token) { Doorkeeper::AccessToken.create!(application: create(:oauth_application), resource_owner_id: user.id) }

    before { sign_in user }

    it "ends the Rails session, revokes the token and tells the Next frontend" do
      get destroy_user_session_from_next_path, params: { access_token: access_token.token }

      expect(response).to redirect_to("#{EnvConfig.NEXT_FRONTEND_URL}?signed_out=true")
      expect(controller.current_user).to be_nil
      expect(access_token.reload).to be_revoked
    end

    it "keeps the Rails session without a token" do
      get destroy_user_session_from_next_path

      expect(response).to redirect_to(EnvConfig.NEXT_FRONTEND_URL)
      expect(controller.current_user).to eq user
    end

    it "keeps the Rails session when the token is already revoked" do
      access_token.revoke

      get destroy_user_session_from_next_path, params: { access_token: access_token.token }

      expect(response).to redirect_to(EnvConfig.NEXT_FRONTEND_URL)
      expect(controller.current_user).to eq user
    end

    it "keeps the Rails session of a different user" do
      other_token = Doorkeeper::AccessToken.create!(application: create(:oauth_application), resource_owner_id: create(:user).id)

      get destroy_user_session_from_next_path, params: { access_token: other_token.token }

      expect(response).to redirect_to("#{EnvConfig.NEXT_FRONTEND_URL}?signed_out=true")
      expect(controller.current_user).to eq user
    end
  end
end
