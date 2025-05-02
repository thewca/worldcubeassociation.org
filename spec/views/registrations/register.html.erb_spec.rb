# frozen_string_literal: true

require "rails_helper"

RSpec.describe "registrations/register" do
  it "shows waiting list information" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    competition = create(:competition, :registration_open)
    create(:registration, competition: competition)
    registration2 = create(:registration, competition: competition)
    create(:registration, competition: competition)

    allow(view).to receive(:current_user) { registration2.user }
    assign(:registration, registration2)
    assign(:competition, competition)
    assign(:selected_events, [])

    render
    expect(rendered).to match(/Accept competition terms/)
    expect(rendered).to match(/Your registration is pending approval by the organizers./)
  end

  it "shows message about registration being past" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    competition = create(:competition,
                         use_wca_registration: true,
                         registration_open: 1.week.ago,
                         registration_close: Time.now.yesterday,
                         starts: 1.month.from_now,
                         ends: 1.month.from_now)

    assign(:competition, competition)

    render
    expect(rendered).to match(/Accept competition terms/)
    expect(rendered).to match(/Registration closed <strong>[^>]*<.strong> ago/)
  end

  it "shows message about registration not yet being open" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    competition = create(:competition,
                         use_wca_registration: true,
                         registration_open: 1.week.from_now,
                         registration_close: 2.weeks.from_now,
                         starts: 1.month.from_now,
                         ends: 1.month.from_now)

    assign(:competition, competition)

    render
    expect(rendered).to match(/Accept competition terms/)
    expect(rendered).to match(/Registration will open in <strong>[^>]*<.strong>/)
  end

  def setup(payment_status)
    competition = create(:competition, :stripe_connected, :visible, :registration_open)
    registration = create(:registration, payment_status, competition: competition, organizer_comment: "👽")
    allow(view).to receive(:current_user) { registration.user }
    assign(:competition, competition)
    assign(:registration, registration)
    assign(:selected_events, [])
    render
  end

  it "renders paid registrations" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    setup :paid
    expect(rendered).to match(/Accept competition terms/)
    expect(rendered).to match(/which fully covers the registration fees/)
  end

  it "renders unpaid registrations and ask for payment" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    setup :unpaid
    expect(rendered).to match(/Accept competition terms/)
    expect(rendered).to match(/Pay now!/)
  end

  it "only shows fields that are editable by a competitor" do
    pending("Until we find a better way to statically test React pages. Signed GB 11/13/2024")

    setup :paid
    expect(rendered).to match(/Accept competition terms/)

    expect(rendered).to match(/Events/)
    expect(rendered).to match(/Guests/)
    expect(rendered).to match(/Comments/)

    expect(rendered).not_to match(/Administrative [Nn]otes/)
    expect(rendered).not_to match(/👽/)

    expect(rendered).not_to match(/Status/)
  end
end
