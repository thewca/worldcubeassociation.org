# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Media" do
  context "when signed in as regular user" do
    let(:competition) { FactoryBot.create(:competition) }
    let!(:user) { FactoryBot.create(:user) }

    before :each do
      sign_in user
    end

    scenario "submit new media" do
      visit "/media/new"
      fill_in "Text", with: "I am a brand new medium!"
      fill_in "Link", with: "https://example.com"
      fill_in "Submitter comment", with: "This is the best medium ever"
      click_button "Submit media"

      # We forgot to fill in competition above, which will cause a validation error.
      # Fill in competition and then resubmit.
      expect(page).to have_text "Competition must exist"
      fill_in "Competition", with: competition.id
      click_button "Submit media"

      medium = CompetitionMedium.find_by_competition_id!(competition.id)
      expect(medium.status).to eq "pending"
      expect(medium.text).to eq "I am a brand new medium!"
      expect(medium.uri).to eq "https://example.com"
      expect(medium.submitter_comment).to eq "This is the best medium ever"
    end
  end

  context "when signed in as WCT member" do
    let!(:medium1) { FactoryBot.create(:competition_medium, text: "Article 1") }
    let!(:medium2) { FactoryBot.create(:competition_medium, text: "Article 2") }

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
        click_button "Update media"
        expect(medium2.reload.status).to eq "accepted"
      end

      scenario "change text" do
        expect(medium2.text).to eq "Article 2"
        fill_in "Text", with: "New text"
        click_button "Update media"
        expect(medium2.reload.text).to eq "New text"
      end
    end
  end
end

def within_medium_row(medium, &)
  within("tr[data-medium-id='#{medium.id}']", &)
end
