require "rails_helper"

RSpec.feature "competition results" do
  let(:competition) { FactoryGirl.create :competition, eventSpecs: "333" }
  let(:person_1) { FactoryGirl.create :person, name: "Fast Cuber" }
  let(:person_2) { FactoryGirl.create :person, name: "Slow Cuber" }

  let!(:result_1) { FactoryGirl.create :result, competition: competition, eventId: "333", roundId: "c", pos: 1, person: person_1 }
  let!(:result_2) { FactoryGirl.create :result, competition: competition, eventId: "333", roundId: "c", pos: 2, person: person_2 }
  before do
  end

  describe "winners" do
    it "displays the winners for each event" do
      visit competition_path(competition)
      expect(page).to have_content(person_1.name)
      expect(page).to_not have_content(person_2.name)
    end
  end

  describe "by person" do
    it "displays the results for each person" do
      visit competition_results_by_person_path(competition)
      expect(page).to have_content("#{person_1.name} USA")
      expect(page).to have_content("#{person_2.name} USA")
    end
  end

  describe "all results" do
    it "displays the results for each person" do
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
