# frozen_string_literal: true
require "rails_helper"

RSpec.describe "registrations/register" do
  it "shows waiting list information" do
    competition = FactoryGirl.create(:competition, :registration_open)
    FactoryGirl.create(:registration, competition: competition)
    registration2 = FactoryGirl.create(:registration, competition: competition)
    FactoryGirl.create(:registration, competition: competition)

    allow(view).to receive(:current_user) { registration2.user }
    assign(:registration, registration2)
    assign(:competition, competition)

    render
    expect(rendered).to match /Your registration is pending./
  end

  it "shows message about registration being past" do
    competition = FactoryGirl.create(:competition, use_wca_registration: true, registration_open: 1.week.ago, registration_close: Time.now.yesterday)

    assign(:competition, competition)

    render
    expect(rendered).to match /Registration closed <strong>[^>]*<.strong> ago/
  end

  it "shows message about registration not yet being open" do
    competition = FactoryGirl.create(:competition, use_wca_registration: true, registration_open: 1.week.from_now, registration_close: 2.weeks.from_now)

    assign(:competition, competition)

    render
    expect(rendered).to match /Registration will open in <strong>[^>]*<.strong>/
  end
end
