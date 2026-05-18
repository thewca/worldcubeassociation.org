# frozen_string_literal: true

require "rails_helper"

RSpec.describe UpdateLiveResultJob do
  let(:competition) { create(:competition, :registration_open, event_ids: %w[333]) }
  let(:user) { create(:user, :wca_id) }
  let(:person) { user.person }
  let(:registration) { create(:registration, :accepted, competition: competition, user: user, event_ids: %w[333]) }
  let(:round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 1, total_number_of_rounds: 1) }
  let(:live_result) { round.create_empty_live_result(registration.id) }
  let(:entered_by_id) { user.id }

  # Ao5 of these five times: best=800, worst=900, middle three avg => (820+850+870)/3 = 846 (rounded)
  let(:attempts) do
    [
      { attempt_number: 1, value: 800 },
      { attempt_number: 2, value: 900 },
      { attempt_number: 3, value: 850 },
      { attempt_number: 4, value: 870 },
      { attempt_number: 5, value: 820 },
    ]
  end

  def perform
    UpdateLiveResultJob.perform_now(live_result, attempts, entered_by_id)
    live_result.reload
  end

  describe "single_record_tag" do
    context "when the competitor beats their personal best single" do
      before { create(:ranks_single, person_id: person.wca_id, event_id: "333", best: 1000) }

      it "sets single_record_tag to PR" do
        expect(perform.single_record_tag).to eq "PR"
      end
    end

    context "when the competitor does not beat their personal best single" do
      before { create(:ranks_single, person_id: person.wca_id, event_id: "333", best: 500) }

      it "leaves single_record_tag nil" do
        expect(perform.single_record_tag).to be_nil
      end
    end

    context "when the competitor has no existing single PR for this event" do
      it "sets single_record_tag to PR" do
        expect(perform.single_record_tag).to eq "PR"
      end
    end

    context "when the competitor is a newcomer (no person)" do
      let(:user) { create(:user) }

      it "sets single_record_tag to PR" do
        expect(perform.single_record_tag).to eq "PR"
      end
    end

    context "when a previous round has a PR that is better than or equal to the current best" do
      let(:round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 2, total_number_of_rounds: 2) }
      let(:previous_round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 1, total_number_of_rounds: 2) }

      before do
        create(:live_result, round: previous_round, registration: registration, single_record_tag: "PR", best: 800, average: 700)
      end

      it "does not set single_record_tag to PR" do
        expect(perform.single_record_tag).to be_nil
      end
    end

    context "when a previous round has a PR but the current best is even better" do
      let(:round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 2, total_number_of_rounds: 2) }
      let(:previous_round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 1, total_number_of_rounds: 2) }

      before do
        create(:live_result, round: previous_round, registration: registration, single_record_tag: "PR", best: 1500, average: 700)
      end

      it "sets single_record_tag to PR" do
        expect(perform.single_record_tag).to eq "PR"
      end
    end

    context "when the best is invalid (DNF)" do
      let(:attempts) { [{ attempt_number: 1, value: -1 }] * 5 }

      it "leaves single_record_tag nil" do
        expect(perform.single_record_tag).to be_nil
      end
    end
  end

  describe "average_record_tag" do
    context "when the competitor beats their personal best average" do
      before { create(:ranks_average, person_id: person.wca_id, event_id: "333", best: 1000) }

      it "sets average_record_tag to PR" do
        expect(perform.average_record_tag).to eq "PR"
      end
    end

    context "when the competitor does not beat their personal best average" do
      before { create(:ranks_average, person_id: person.wca_id, event_id: "333", best: 500) }

      it "leaves average_record_tag nil" do
        expect(perform.average_record_tag).to be_nil
      end
    end

    context "when the competitor has no existing average PR for this event" do
      it "sets average_record_tag to PR" do
        expect(perform.average_record_tag).to eq "PR"
      end
    end

    context "when the competitor is a newcomer (no person)" do
      let(:user) { create(:user) }

      it "sets average_record_tag to PR" do
        expect(perform.average_record_tag).to eq "PR"
      end
    end

    context "when a previous round has a PR that is better than or equal to the current average" do
      let(:round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 2, total_number_of_rounds: 2) }
      let(:previous_round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 1, total_number_of_rounds: 2) }

      before do
        create(:live_result, round: previous_round, registration: registration, average_record_tag: "PR", best: 600, average: 846)
      end

      it "does not set average_record_tag to PR" do
        expect(perform.average_record_tag).to be_nil
      end
    end

    context "when a previous round has a PR but the current average is even better" do
      let(:round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 2, total_number_of_rounds: 2) }
      let(:previous_round) { create(:round, competition: competition, event_id: "333", format_id: "a", number: 1, total_number_of_rounds: 2) }

      before do
        create(:live_result, round: previous_round, registration: registration, average_record_tag: "PR", best: 600, average: 2000)
      end

      it "sets average_record_tag to PR" do
        expect(perform.average_record_tag).to eq "PR"
      end
    end

    context "when all attempts are DNF (average invalid)" do
      let(:attempts) { [{ attempt_number: 1, value: -1 }] * 5 }

      it "leaves average_record_tag nil" do
        expect(perform.average_record_tag).to be_nil
      end
    end
  end
end
