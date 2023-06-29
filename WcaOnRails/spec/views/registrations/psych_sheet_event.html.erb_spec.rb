# frozen_string_literal: true

require "rails_helper"

RSpec.describe "registrations/psych_sheet_event", clean_db_with_truncation: true do
  it "works" do
    competition = FactoryBot.create(:competition, :registration_open)
    event = Event.find("333")

    the_best = FactoryBot.create(:user, :wca_id, name: "Best Guy")
    FactoryBot.create(:ranks_average, eventId: "333", rank: 1, best: "500", personId: the_best.wca_id)
    FactoryBot.create(:ranks_single, eventId: "333", rank: 1, best: "450", personId: the_best.wca_id)

    tied_first = FactoryBot.create(:user, :wca_id, name: "Tied But Better")
    FactoryBot.create(:ranks_average, eventId: "333", rank: 10, best: "2000", personId: tied_first.wca_id)
    FactoryBot.create(:ranks_single, eventId: "333", rank: 10, best: "1500", personId: tied_first.wca_id)

    tied_second = FactoryBot.create(:user, :wca_id, name: "Tied But Worse")
    FactoryBot.create(:ranks_average, eventId: "333", rank: 10, best: "2000", personId: tied_second.wca_id)
    FactoryBot.create(:ranks_single, eventId: "333", rank: 20, best: "1899", personId: tied_second.wca_id)

    # Two guys who have never competed before.
    newcomer1 = FactoryBot.create(:user, name: "Newcomer I")
    newcomer2 = FactoryBot.create(:user, name: "Newcomer II")

    [the_best, tied_first, tied_second, newcomer1, newcomer2].each do |user|
      FactoryBot.create(:registration, :accepted, user: user, competition: competition, events: [event])
    end

    assign(:competition, competition)
    assign(:event, event)
    assign(:preferred_format, event.recommended_format)
    assign(:psych_sheet, competition.psych_sheet_event(event, event.recommended_format.sort_by))

    render

    [
      { pos: 1,   name: "Best Guy",         average: "5.00",  single: "4.50" },
      { pos: 2,   name: "Tied But Better",  average: "20.00", single: "15.00" },
      { pos: 2,   name: "Tied But Worse",   average: "20.00", single: "18.99" },
      { pos: "",  name: "Newcomer I",       average: "",      single: "" },
      { pos: "",  name: "Newcomer II",      average: "",      single: "" },
    ].each_with_index do |criteria, i|
      criteria.each do |td_class, value|
        expect(rendered).to have_css(".wca-results tbody tr:nth-child(#{i + 1}) td.#{td_class}", text: value)
      end
    end
  end
end
