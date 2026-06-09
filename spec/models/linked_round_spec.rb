# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LinkedRound do
  let(:competition) { create(:competition) }
  let(:linked_round) { create(:linked_round) }

  context "final_round?" do
    it "returns true for Dual Rounds with round 1 + 2 of 2" do
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 2, number: 1)
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 2, number: 2)

      expect(linked_round).to be_final_round
    end

    it "returns false for Dual Rounds with round 1 + 2 of 3" do
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2)

      expect(linked_round).not_to be_final_round
    end
  end

  context "validations" do
    it "considers a standard Dual Round as valid" do
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2)

      expect(linked_round).to be_valid
    end

    it "does not allow linking more than 2 rounds" do
      r1 = create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)
      r2 = create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2)

      # Create it as standalone round initially
      r3 = create(:round, event_id: "333", competition: competition, total_number_of_rounds: 3, number: 3)

      # Technically valid but our Regulations forbid it
      linked_round.rounds = [r1, r2, r3]

      expect(linked_round).to be_invalid_with_errors(round_ids: ["can only include up to 2 rounds in a Dual Round"])
    end

    it "does not allow linking rounds other than first round" do
      create(:round, event_id: "333", competition: competition, total_number_of_rounds: 3, number: 1)

      r2 = create(:round, event_id: "333", competition: competition, total_number_of_rounds: 3, number: 2)
      r3 = create(:round, event_id: "333", competition: competition, total_number_of_rounds: 3, number: 3)

      # Technically valid but our Regulations forbid it
      linked_round.rounds = [r2, r3]

      expect(linked_round).to be_invalid_with_errors(first_round_number: ["can only include the first two rounds of a competition"])
    end

    context "does not allow linking 2 rounds" do
      it "that have different formats" do
        create(:round, event_id: "333fm", format_id: "2", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)
        create(:round, event_id: "333fm", format_id: "1", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2)

        expect(linked_round).to be_invalid_with_errors(format_ids: ["all rounds must have the same format"])
      end

      it "that have different cutoffs" do
        create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1, cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 2000))
        create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2, cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 3000))

        expect(linked_round).to be_invalid_with_errors(round_cutoffs: ["all rounds must have the same cutoff"])
      end

      it "that have different time limits" do
        create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)
        create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2, time_limit: TimeLimit.new(centiseconds: 5.minutes.in_centiseconds))

        expect(linked_round).to be_invalid_with_errors(round_time_limits: ["all rounds must have the same time limit"])
      end
    end

    context "when linking rounds of a championship" do
      let(:competition) { create(:competition, :world_championship) }

      it "allows linking non-final rounds" do
        create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)
        create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2)

        expect(linked_round).to be_valid
      end

      it "does not allow linking final rounds" do
        # These are rounds with the same format, cutoff and time limit, so basically they could be linked.
        #   However, there are only two rounds overall, so the "first two rounds" stipulated by 9v1
        #   also accidentally implies that the second round is the final, which in turn violates 9v2.
        r1 = create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 2, number: 1)
        r2 = build(:round, event_id: "333", competition: competition, total_number_of_rounds: 2, number: 2)

        linked_round.rounds = [r1, r2]

        expect(linked_round).to be_invalid_with_errors(final_round_of_championship?: ["cannot include the final round of any championship"])
      end
    end
  end

  context "cleaning up orphans via after_destroy hook" do
    it "does not clean up a perfectly valid Dual Round" do
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2)

      expect(linked_round.reload).not_to be_nil
    end

    it "cleans up a valid Dual Round after deleting one round" do
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)
      r2 = create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 2)

      expect(linked_round.reload).not_to be_nil

      linked_round.rounds.delete(r2)

      expect(r2.reload.linked_round_id).to be_nil
      expect { linked_round.reload }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "does not clean up while building a perfectly valid Dual Round" do
      create(:round, event_id: "333", competition: competition, linked_round: linked_round, total_number_of_rounds: 3, number: 1)

      # Intentionally create it without a linked_round first
      r2 = create(:round, event_id: "333", competition: competition, total_number_of_rounds: 3, number: 2)

      expect(linked_round.reload).not_to be_nil

      linked_round.rounds << r2
      expect(linked_round.reload).not_to be_nil
    end
  end
end
