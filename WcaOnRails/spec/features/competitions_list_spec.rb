# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competitions list" do
  context "list view" do
    context "when a delegate is set in the params" do
      let(:competition) { FactoryBot.create :competition, :visible, :future }
      let(:delegate) { competition.delegates.first }

      before do
        visit "/competitions"
        within(:css, "#delegate") do
          find(".search").set(delegate.name)
          find(".search").send_keys(:enter)
        end
      end

      it "the delegate is selected within the form", js: true do
        expect(page.find("#competition-query-form #delegate")).to have_text(delegate.name)
      end

      it "only competitions delegated by the given delegate are shown", js: true do
        expect(page).to have_selector("#competitions-list .competition-info", count: 1)
      end
    end
  end

  context "admin view" do
    before :each do
      sign_in FactoryBot.create(:admin)
    end

    it 'renders finished competition without results' do
      FactoryBot.create(:competition, :visible, starts: 2.days.ago, name: "Test Comp 2017")
      visit '/competitions?state=recent&display=admin'
      expect(page).to have_http_status(200)
      tr = page.find("tr", text: "Test Comp 2017")

      results_td = tr.find("td:nth-child(6).admin-date")
      expect(results_td.text).to eq "pending"
      expect(results_td[:class].split).to match_array %w(admin-date)
    end
  end
end
