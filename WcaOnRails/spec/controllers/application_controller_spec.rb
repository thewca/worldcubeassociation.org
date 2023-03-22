# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ApplicationController do
  describe "GET #update_locale" do
    let!(:user) { FactoryBot.create(:user) }

    it "updates the user preferred locale and the session locale" do
      sign_in user
      expect(user.preferred_locale).to be_nil
      expect(session[:locale]).not_to eq "fr"
      patch :update_locale, params: { locale: :fr }
      user.reload
      expect(user.preferred_locale).to eq "fr"
      expect(session[:locale]).to eq "fr"
    end

    it "redirects to given current_url" do
      sign_in user
      redirect_url = "#{request.original_url}#bar"
      patch :update_locale, params: { locale: :fr, current_url: redirect_url }
      expect(response).to redirect_to redirect_url
    end

    it "redirects to root if not given current_url" do
      sign_in user
      patch :update_locale, params: { locale: :fr }
      expect(response).to redirect_to root_url
    end
  end
end
