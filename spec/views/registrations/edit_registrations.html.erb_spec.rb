# frozen_string_literal: true

require "rails_helper"

RSpec.describe "registrations/edit_registrations" do
  it "shows organizer comment when a registration has them" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    competition = create(:competition, :registration_open)
    create(:registration, competition: competition, organizer_comment: "😎")

    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render

    expect(rendered).to match(/Pending registrations/)
    expect(rendered).to match(/Organizer notes/)
    expect(rendered).to match(/😎/)
  end

  it "hides organizer comment when no registrations have them" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    competition = create(:competition, :registration_open)
    create(:registration, competition: competition)

    assign(:competition, competition)
    assign(:registrations, competition.registrations)

    render

    expect(rendered).to match(/Pending registrations/)
    expect(rendered).not_to match(/organizer comment/)
  end
end
