# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competitions list", :js do
  context "admin view" do
    before :each do
      sign_in create(:admin)
    end

    context "when a delegate is set in the params" do
      let(:competition) { create :competition, :visible, :future }
      let!(:delegate) { competition.delegates.first }

      before do
        visit "/competitions?show_admin_details=yes"
        # Wait for the Delegate index to start loading
        expect(page).to have_selector("#delegate-pulse")
        # …and then wait for it to finish loading
        expect(page).not_to have_selector("#delegate-pulse")
        within(:css, "#delegate") do
          find(".search").set(delegate.name)
          find(".search").send_keys(:enter)
        end
      end

      it "the delegate is selected within the form" do
        expect(page.find("#competition-query-form #delegate")).to have_text(delegate.name)
      end

      it "only competitions delegated by the given delegate are shown" do
        expect(page).to have_selector(".competition-info", count: 1)
      end
    end

    it 'renders finished competition without results' do
      create(:competition, :visible, starts: 2.days.ago, name: "Test Comp 2017")
      visit '/competitions?state=recent&show_admin_details=yes'
      expect(page).to have_http_status(:ok)
      expect(page).to have_text "Test Comp 2017"
      tr = page.find("tr", text: "Test Comp 2017")

      results_td = tr.find("td:nth-child(7)")
      expect(results_td.text).to eq "Pending"
    end
  end
end
