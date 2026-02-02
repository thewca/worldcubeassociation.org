# frozen_string_literal: true

require "rails_helper"

RSpec.feature "create competition tabs" do
  let!(:organizer) { create(:user) }
  let(:competition) { create(:competition, organizers: [organizer]) }

  it "creating a new tab" do
    sign_in organizer
    visit competition_path(competition)
    click_on "Manage tabs"
    click_on "New tab"

    fill_in "Name", with: "Accomodation"
    fill_in "Content", with: "On your own."
    click_on "Create"

    visit competition_path(competition)
    expect(page).to have_content "Accomodation"
    expect(page).to have_content "On your own."
  end

  it "editing an existing tab" do
    create(:competition_tab, competition: competition, name: "Accomodation", content: "On your own.")

    sign_in organizer
    visit competition_path(competition)
    click_on "Manage tabs"
    expect(page).to have_content "New tab" # Wait for the page to fully load
    within("#competition-tabs tbody tr:first") { click_on "Edit" }

    fill_in "Name", with: "Travel!"
    fill_in "Content", with: "Travel informations."
    click_on "Update"

    visit competition_path(competition)
    expect(page).to have_content "Travel!"
    expect(page).to have_content "Travel informations."
    expect(page).to have_no_content "Accomodation"
    expect(page).to have_no_content "On your own."
  end
end
