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
end

RSpec.feature "dual-round competition podiums" do
  # :confirmed builds a schedule and already inserts round 1. Reuse it and add
  # the second linked round with the same participation source.
  let(:competition) { create(:competition, :confirmed, :visible, :results_posted, events: Event.where(id: "333fm")) }
  let(:round_one) do
    competition.rounds.find_by!(number: 1).tap { |round| round.update!(total_number_of_rounds: 2, format_id: "m") }
  end
  let(:round_two) { create(:round, competition: competition, event_id: "333fm", format_id: "m", number: 2, total_number_of_rounds: 2) }
  let(:alice) { create(:person, name: "Alice") }
  let(:carol) { create(:person, name: "Carol") }
  let(:bob) { create(:person, name: "Bob") }
  let(:dana) { create(:person, name: "Dana") }

  before do
    create(:linked_round, rounds: [round_one, round_two])

    create(:result, :fm, competition: competition, round: round_one, round_type_id: "1", person: alice,
                         pos: 1, global_pos: 1, best: 18, average: 2067, value1: 18, value2: 22, value3: 22)
    create(:result, :fm, competition: competition, round: round_one, round_type_id: "1", person: bob,
                         pos: 2, global_pos: 2, best: 19, average: 2100, value1: 19, value2: 23, value3: 21)
    create(:result, :fm, competition: competition, round: round_two, round_type_id: "f", person: carol,
                         pos: 1, global_pos: 2, best: 19, average: 2100, value1: 19, value2: 21, value3: 23)
    create(:result, :fm, competition: competition, round: round_two, round_type_id: "f", person: dana,
                         pos: 2, global_pos: 4, best: 21, average: 2267, value1: 23, value2: 21, value3: 24)
  end

  it "shows the combined ranking, not each competitor's place in their own round" do
    visit competition_results_podiums_path(competition)

    expect(find("tr", text: alice.name).find("td.pos").text).to eq "1"
    expect(find("tr", text: carol.name).find("td.pos").text).to eq "2"
    expect(find("tr", text: bob.name).find("td.pos").text).to eq "2"
    expect(page).not_to have_text(dana.name)
  end
end
