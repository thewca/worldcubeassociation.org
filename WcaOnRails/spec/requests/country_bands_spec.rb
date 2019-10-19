# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Country bands controller" do
  describe "GET /index" do
    context "when not signed in" do
      sign_out
      it "shows the page" do
        get country_bands_path
        expect(response).to be_successful
      end
    end
  end

  describe "GET /edit" do
    context "when not signed in" do
      sign_out
      it "redirect to login page" do
        get edit_country_band_path(0)
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as a regular user" do
      sign_in { FactoryBot.create :user }
      it "redirect to root" do
        get edit_country_band_path(0)
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a WFC member" do
      sign_in { FactoryBot.create :user, :wfc_member }
      it "shows the page" do
        get edit_country_band_path(0)
        expect(response).to be_successful
      end
    end
  end

  describe "PUT /update" do
    let(:some_countries) { ["US", "AL"] }

    context "when signed in as a regular user" do
      sign_in { FactoryBot.create :user }
      it "redirect to root" do
        put country_band_path(0, params: { countries: { iso2s: some_countries.join(",") } })
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a WFC member" do
      before :each do
        sign_in(FactoryBot.create(:user, :wfc_member))
      end

      it "adds country to band" do
        put country_band_path(0, params: { countries: { iso2s: some_countries.join(",") } })
        expect(response).to be_successful
        expect(CountryBand.where(number: 0).map(&:iso2)).to match_array some_countries
      end

      it "removes country from band" do
        some_countries.each do |iso2|
          CountryBand.create(number: 0, iso2: iso2)
        end
        new_countries = ["FR", "SA"]
        expect(CountryBand.where(number: 0).map(&:iso2)).to match_array some_countries
        put country_band_path(0, params: { countries: { iso2s: new_countries.join(",") } })
        expect(response).to be_successful
        expect(CountryBand.where(number: 0).map(&:iso2)).to match_array new_countries
      end

      it "changes country from band" do
        CountryBand.create(number: 0, iso2: "FR")
        put country_band_path(1, params: { countries: { iso2s: "FR" } })
        expect(response).to be_successful
        expect(CountryBand.where(number: 0)).to be_empty
        expect(CountryBand.where(number: 1).map(&:iso2)).to eq ["FR"]
      end
    end
  end
end
