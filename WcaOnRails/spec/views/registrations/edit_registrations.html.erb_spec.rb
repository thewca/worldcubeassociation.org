# frozen_string_literal: true

require "rails_helper"

RSpec.describe "registrations/edit_registrations" do
  it "shows administrative notes when a registration has them" do
    competition = FactoryBot.create(:competition, :registration_open)
    FactoryBot.create(:registration, competition: competition, administrative_notes: "😎")

    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render
    expect(rendered).to match(/Administrative Notes/)
    expect(rendered).to match(/😎/)
  end

  it "hides administrative notes when no registrations have them" do
    competition = FactoryBot.create(:competition, :registration_open)
    FactoryBot.create(:registration, competition: competition)

    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render
    expect(rendered).not_to match(/Administrative Notes/)
  end
end
