# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions/my_competitions" do
  let(:competition) { create(:competition, :registration_open, name: "Melbourne Open 2016") }
  let(:registration) { create(:registration, competition: competition) }
  let(:competition2) { create(:competition, :visible, name: "Cambridge Open 2020") }
  let(:competition3) { create(:competition, :visible, :world_championship, name: "World Open 2020") }

  before do
    allow(view).to receive(:current_user) { registration.user }
    assign(:my_competitions, { past: [], future: [competition], bookmarked: [competition2, competition3] })
    assign(:my_registrations, competition.id => registration)
  end

  it "shows upcoming competitions" do
    pending("Pending until we find a way to test React components signed icklerf 10-12-2024")
    render
    expect(rendered).to match '<a href="/competitions/MelbourneOpen2016">Melbourne Open 2016</a>'
  end

  it "shows pending registration tooltip" do
    pending("Pending until we find a way to test React components signed icklerf 10-12-2024")
    render
    expect(rendered).to include 'Your registration is awaiting manual approval. Please ensure you have followed all instructions (eg, payment) listed in the Competition Page.'
    expect(rendered).to match '<i class="icon hourglass half "></i>'
  end

  it "shows bookmarked competitions" do
    pending("Pending until we find a way to test React components signed icklerf 10-12-2024")
    render
    expect(rendered).to match '<a href="/competitions/CambridgeOpen2020">Cambridge Open 2020</a>'
  end

  it "shows championship icon" do
    pending("Pending until we find a way to test React components signed icklerf 10-12-2024")
    render
    expect(rendered).to match '<a href="/competitions/WorldOpen2020">World Open 2020</a>'
    expect(rendered).to match '<span class="championship-trophy" data-toggle="tooltip" data-placement="bottom" title="World Championship">'
  end
end
