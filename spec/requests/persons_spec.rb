# frozen_string_literal: true

require "rails_helper"

RSpec.describe "persons" do
  describe "profile page" do
    let!(:person) { create(:person_who_has_competed_once) }
    # Create person with account, so that there is the default avatar to display.
    let!(:user) { create(:user, :wca_id, person: person) }

    it 'renders without error' do
      get person_path(person.wca_id)
      expect(response).to be_successful
    end

    context "with results in a dual round" do
      let!(:competition) { create(:competition, event_ids: ["333"]) }
      let!(:round_one) { create(:round, competition: competition, event_id: "333", number: 1, total_number_of_rounds: 2) }
      let!(:round_two) { create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2) }

      before do
        create(:linked_round, rounds: [round_one, round_two])
        create(:result, person: person, competition: competition, event_id: "333", round: round_one, round_type_id: "1", best: 350, average: 400, pos: 4, global_pos: 2)
      end

      it 'marks the round as dual and shows the local and global position' do
        get person_path(person.wca_id)
        expect(response.body).to include("First round (Dual)")
        expect(response.body).to include("4 (2)")
      end
    end
  end
end
