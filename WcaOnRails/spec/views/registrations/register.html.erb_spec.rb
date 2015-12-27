require "rails_helper"

RSpec.describe "registrations/register" do
  it "shows waiting list information" do
    competition = FactoryGirl.create(:competition)
    registration1 = FactoryGirl.create(:registration, competition: competition)
    registration2 = FactoryGirl.create(:registration, competition: competition)
    registration3 = FactoryGirl.create(:registration, competition: competition)

    allow(view).to receive(:current_user) { registration2.user }
    assign(:registration, registration2)
    assign(:competition, competition)

    render
    expect(rendered).to match /You are currently number 2 of 3 on the waiting list/
  end
end
