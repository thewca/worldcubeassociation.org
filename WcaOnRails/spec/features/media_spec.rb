# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Media" do
  let!(:medium1) { FactoryBot.create(:competition_medium, text: "Article 1") }
  let!(:medium2) { FactoryBot.create(:competition_medium, text: "Article 2") }

  context "when signed in as WCT member" do
    before :each do
      sign_in FactoryBot.create :user, :wct_member
    end

    context "validate media list" do
      scenario "accept media" do
        visit "/media/validate"

        within_medium_row(medium2) do
          click_button "Accept"
        end

        expect(medium2.reload.status).to eq "accepted"
      end

      scenario "delete media" do
        visit "/media/validate"

        within_medium_row(medium2) do
          click_button "Delete"
        end

        expect(CompetitionMedium.find_by_id(medium2.id)).to be_nil
      end
    end

    context "edit media" do
      before :each do
        visit "/media/validate"
        within_medium_row(medium2) do
          click_link "Edit"
        end
      end

      scenario "delete it" do
        click_link "Delete"
        expect(CompetitionMedium.find_by_id(medium2.id)).to be_nil
      end

      scenario "accept it" do
        select "Accepted", from: "Status"
        click_button "Update Competition medium"
        expect(medium2.reload.status).to eq "accepted"
      end

      scenario "change text" do
        expect(medium2.text).to eq "Article 2"
        fill_in "Text", with: "New text"
        click_button "Update Competition medium"
        expect(medium2.reload.text).to eq "New text"
      end
    end
  end
end

def within_medium_row(medium, &blk)
  within("tr[data-medium-id='#{medium.id}']", &blk)
end
