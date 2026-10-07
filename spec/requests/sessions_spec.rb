# frozen_string_literal: true

require "rails_helper"

RSpec.describe "sessions" do
  describe "GET #destroy_from_next" do
    sign_in { create(:user) }

    it "ends the Rails session and returns to the Next frontend" do
      get destroy_user_session_from_next_path

      expect(response).to redirect_to(EnvConfig.NEXT_FRONTEND_URL)
      expect(controller.current_user).to be_nil
    end
  end
end
