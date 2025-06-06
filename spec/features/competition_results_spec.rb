# frozen_string_literal: true

require "rails_helper"

RSpec.feature "competition results" do
  let(:competition) { create(:competition, :confirmed, :visible, :results_posted, events: Event.where(id: '333')) }
  let(:person_1) { create(:person, name: "Fast Cuber", country_id: "USA") }
  let(:person_2) { create(:person, name: "Slow Cuber", country_id: "USA") }

  let!(:result_1) { create(:result, competition: competition, event_id: "333", round_type_id: "f", pos: 1, person: person_1) }
  let!(:result_2) { create(:result, competition: competition, event_id: "333", round_type_id: "f", pos: 2, person: person_2) }

  describe "winners" do
    it "displays the winners for each event" do
      visit competition_path(competition)
      expect(page).to have_content(person_1.name)
    end
  end

  describe "by person" do
    it "displays the results for each person" do
      visit competition_results_by_person_path(competition)
      expect(page).to have_content("#{person_1.name} - United States")
      expect(page).to have_content("#{person_2.name} - United States")
    end
  end

  describe "all results" do
    it "displays the results for each person", :js do
      visit competition_results_all_path(competition)
      expect(page).to have_content(person_1.name)
      expect(page).to have_content(person_2.name)
    end
  end

  describe "podiums" do
    it "lists the first three" do
      visit competition_results_podiums_path(competition)

      expect(page).to have_content(person_1.name)
      expect(page).to have_content(person_2.name)
    end
  end
end
