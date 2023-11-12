# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "WFC controller" do
  describe "GET /panel" do
    context "when not signed in" do
      sign_out
      it "redirect to login page" do
        get '/panel/wfc'
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as a regular user" do
      sign_in { FactoryBot.create :user }
      it "redirect to root" do
        get '/panel/wfc'
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a WFC member" do
      sign_in { FactoryBot.create :user, :wfc_member }
      it "shows the page" do
        get '/panel/wfc'
        expect(response).to be_successful
      end
    end
  end
  describe "GET /competitions_export" do
    context "when signed in as a regular user" do
      sign_in { FactoryBot.create :user }
      it "redirect to root" do
        get wfc_competitions_export_path(from_date: Time.now, to_date: Time.now)
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a WFC member" do
      sign_in { FactoryBot.create :user, :wfc_member }
      it "shows the page" do
        get wfc_competitions_export_path(from_date: Time.now, to_date: Time.now)
        expect(response).to be_successful
        # Don't bother checking the actual data here, the WFC will complain if it's broken and may want to change it overtime.
      end
    end
  end
end
