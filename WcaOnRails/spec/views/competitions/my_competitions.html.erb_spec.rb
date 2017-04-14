# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions/my_competitions" do
  let(:competition) { FactoryGirl.create(:competition, :registration_open, name: "Melbourne Open 2016") }
  let(:registration) { FactoryGirl.create(:registration, competition: competition) }

  before do
    allow(view).to receive(:current_user) { registration.user }
    assign(:not_past_competitions, [competition])
    assign(:past_competitions, [])
  end

  it "shows upcoming competitions" do
    render
    expect(rendered).to match '<td><a href="/competitions/MelbourneOpen2016">Melbourne Open 2016</a></td>'
  end

  it "shows you are on the waiting list" do
    render
    expect(rendered).to match 'You are currently on the waiting list'
    expect(rendered).to match '<i class="fa fa-hourglass-half"></i>'
  end
end
