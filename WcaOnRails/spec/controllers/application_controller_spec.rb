# frozen_string_literal: true
require 'rails_helper'

RSpec.describe ApplicationController do
  describe "GET #update_locale" do
    let(:user) { FactoryGirl.create(:user) }

    it "updates the user preferred locale and the session locale" do
      sign_in user
      expect(user.preferred_locale).to be_nil
      expect(session[:locale]).not_to eq "fr"
      patch :update_locale, locale: :fr
      user.reload
      expect(user.preferred_locale).to eq "fr"
      expect(session[:locale]).to eq "fr"
    end
  end
end
