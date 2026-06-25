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

    expect(rendered).to include('Pending registrations')
    expect(rendered).to include('Administrative notes')
    expect(rendered).to include('😎')
  end

  it "hides administrative notes when no registrations have them" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    competition = create(:competition, :registration_open)
    create(:registration, competition: competition)

    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render

    expect(rendered).to include('Pending registrations')
    expect(rendered).not_to include('Administrative notes')
  end
end
