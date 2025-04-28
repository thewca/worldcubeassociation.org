# frozen_string_literal: true

require "rails_helper"

RSpec.describe "registrations/edit_registrations" do
  it "shows administrative notes when a registration has them" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    competition = create(:competition, :registration_open)
    create(:registration, competition: competition, administrative_notes: "😎")

    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render

    expect(rendered).to match(/Pending registrations/)
    expect(rendered).to match(/Administrative notes/)
    expect(rendered).to match(/😎/)
  end

  it "hides administrative notes when no registrations have them" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    competition = create(:competition, :registration_open)
    create(:registration, competition: competition)

    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render

    expect(rendered).to match(/Pending registrations/)
    expect(rendered).not_to match(/Administrative notes/)
  end
end
