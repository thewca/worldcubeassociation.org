# frozen_string_literal: true

require "rails_helper"

RSpec.describe "registrations/register" do
  it "shows waiting list information" do
    competition = FactoryBot.create(:competition, :registration_open)
    FactoryBot.create(:registration, competition: competition)
    registration2 = FactoryBot.create(:registration, competition: competition)
    FactoryBot.create(:registration, competition: competition)

    allow(view).to receive(:current_user) { registration2.user }
    assign(:registration, registration2)
    assign(:competition, competition)
    assign(:selected_events, [])

    render
    expect(rendered).to match(/Your registration is pending./)
  end

  it "shows message about registration being past" do
    competition = FactoryBot.create(:competition,
                                    use_wca_registration: true,
                                    registration_open: 1.week.ago,
                                    registration_close: Time.now.yesterday,
                                    starts: 1.month.from_now,
                                    ends: 1.month.from_now)

    assign(:competition, competition)

    render
    expect(rendered).to match(/Registration closed <strong>[^>]*<.strong> ago/)
  end

  it "shows message about registration not yet being open" do
    competition = FactoryBot.create(:competition,
                                    use_wca_registration: true,
                                    registration_open: 1.week.from_now,
                                    registration_close: 2.weeks.from_now,
                                    starts: 1.month.from_now,
                                    ends: 1.month.from_now)

    assign(:competition, competition)

    render
    expect(rendered).to match(/Registration will open in <strong>[^>]*<.strong>/)
  end

  def setup(payment_status)
    competition = FactoryBot.create(:competition, :stripe_connected, :visible, :registration_open)
    registration = FactoryBot.create(:registration, payment_status, competition: competition, administrative_notes: "👽")
    allow(view).to receive(:current_user) { registration.user }
    assign(:competition, competition)
    assign(:registration, registration)
    assign(:selected_events, [])
    render
  end

  it "renders paid registrations" do
    setup :paid
    expect(rendered).to match(/which fully covers the registration fees/)
  end

  it "renders unpaid registrations and ask for payment" do
    setup :unpaid
    expect(rendered).to match(/Pay now!/)
  end

  it "only shows fields that are editable by a competitor" do
    setup :paid
    expect(rendered).to match(/Events/)
    expect(rendered).to match(/Guests/)
    expect(rendered).to match(/Comments/)

    expect(rendered).not_to match(/Administrative [Nn]otes/)
    expect(rendered).not_to match(/👽/)

    expect(rendered).not_to match(/Status/)
  end
end
