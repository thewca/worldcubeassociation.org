# frozen_string_literal: true

require "rails_helper"

RSpec.feature "competition results" do
  let(:competition) { create(:competition, :confirmed, :visible, :results_posted, events: Event.where(id: '333')) }
  let(:person_1) { create(:person, name: "Fast Cuber", country_id: "USA") }
  let(:person_2) { create(:person, name: "Slow Cuber", country_id: "USA") }

  let!(:round) { create(:round, competition: competition, number: 2) }

  let!(:result_1) { create(:result, competition: competition, event_id: "333", round_type_id: "f", pos: 1, person: person_1, round: round) }
  let!(:result_2) { create(:result, competition: competition, event_id: "333", round_type_id: "f", pos: 2, person: person_2, round: round) }

  describe "winners" do
    it "displays the winners for each event" do
      visit competition_path(competition)
      expect(page).to have_text(person_1.name)
    end
  end

  describe "by person" do
    it "displays the results for each person" do
      visit competition_results_by_person_path(competition)
      expect(page).to have_text("#{person_1.name} - United States")
      expect(page).to have_text("#{person_2.name} - United States")
    end
  end

  describe "all results" do
    it "displays the results for each person", :js do
      visit competition_results_all_path(competition)
      expect(page).to have_text(person_1.name)
      expect(page).to have_text(person_2.name)
    end
  end

  describe "podiums" do
    it "lists the first three" do
      visit competition_results_podiums_path(competition)

      expect(page).to have_text(person_1.name)
      expect(page).to have_text(person_2.name)
    end
  end

  describe "dual rounds" do
    # No `:confirmed`, because that trait already creates a first round for every event.
    let(:dual_competition) { create(:competition, :visible, :results_posted, events: Event.where(id: '333')) }
    let!(:first_round) { create(:round, competition: dual_competition, number: 1, total_number_of_rounds: 2) }
    let!(:final_round) { create(:round, competition: dual_competition, number: 2, total_number_of_rounds: 2) }

    let(:alice) { create(:person, name: "Alice Cuber", country_id: "USA") }
    let(:bob) { create(:person, name: "Bob Cuber", country_id: "USA") }
    let(:carol) { create(:person, name: "Carol Cuber", country_id: "USA") }

    before do
      create(:linked_round, rounds: [first_round, final_round])

      # Each competitor counts with their better average, which is 10.00 for alice, 15.00 for
      # carol and 20.00 for bob, so the podium is alice, carol, bob. Neither round ranks them
      # that way on its own, which is what makes `pos` the wrong number to show on the podium.
      create(:result, person: alice, competition: dual_competition, event_id: "333", round: first_round, round_type_id: "1", best: 500, average: 1000, pos: 1, global_pos: 1)
      create(:result, person: bob, competition: dual_competition, event_id: "333", round: first_round, round_type_id: "1", best: 1500, average: 3000, pos: 2, global_pos: 3)
      create(:result, person: carol, competition: dual_competition, event_id: "333", round: first_round, round_type_id: "1", best: 2500, average: 5000, pos: 3, global_pos: 2)
      create(:result, person: carol, competition: dual_competition, event_id: "333", round: final_round, round_type_id: "f", best: 750, average: 1500, pos: 1, global_pos: 2)
      create(:result, person: bob, competition: dual_competition, event_id: "333", round: final_round, round_type_id: "f", best: 1000, average: 2000, pos: 2, global_pos: 3)
      create(:result, person: alice, competition: dual_competition, event_id: "333", round: final_round, round_type_id: "f", best: 2000, average: 4000, pos: 3, global_pos: 1)
    end

    it "ranks the podium across both rounds instead of within one" do
      visit competition_results_podiums_path(dual_competition)

      expect(page.all("td.pos").map(&:text)).to eq %w[1 2 3]
      expect(page.all("td.name").map(&:text)).to eq [alice.name, carol.name, bob.name]
    end

    it "shows both the round position and the position across both rounds by person" do
      visit competition_results_by_person_path(dual_competition)

      expect(page.all("td.pos").map(&:text)).to contain_exactly("1 (1)", "3 (1)", "2 (3)", "2 (3)", "3 (2)", "1 (2)")
      expect(page.all("td.round").map(&:text)).to all(include("Dual"))
    end
  end
end
