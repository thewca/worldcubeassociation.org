# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competitions list" do
  context "admin view" do
    before :each do
      sign_in FactoryGirl.create(:admin)
    end

    it 'renders finished competition without results' do
      FactoryGirl.create(:competition, :visible, starts: 2.days.ago, name: "Test Comp 2017")
      visit '/competitions?state=recent&display=admin'
      expect(page).to have_http_status(200)
      tr = page.find("tr", text: "Test Comp 2017")

      results_td = tr.find("td:nth-child(6).admin-date")
      expect(results_td.text).to eq "pending"
      expect(results_td[:class].split).to match_array %w(admin-date)
    end
  end
end
