# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionsHelper do
  let(:competition) { create(:competition) }
  let(:final_round) { create(:round, competition: competition) }

  describe "#winners" do
    context "333" do
      def add_result(pos, name, event_id: "333", dnf: false, wca_id: nil, round: nil)
        person = create(:person,
                        wca_id: wca_id || "2006YOYO#{format('%.2d', pos)}",
                        name: name,
                        country_id: "USA")
        create(:result,
               pos: pos,
               person: person,
               competition_id: competition.id,
               event_id: event_id,
               round_type_id: "f",
               format_id: "a",
               round: round,
               value1: dnf ? SolveTime::DNF_VALUE : 999,
               value2: 999,
               value3: 999,
               value4: dnf ? SolveTime::DNF_VALUE : 999,
               value5: 999,
               best: 999,
               average: dnf ? SolveTime::DNF_VALUE : 999)
      end

      let!(:unrelated_round) { create(:round, competition: competition, event_id: "333oh") }
      let!(:unrelated_podium_result) { add_result(1, "joe", event_id: "333oh", wca_id: "2006JOJO01", round: unrelated_round) }

      it "announces top 3 in final" do
        add_result(1, "Jeremy", round: final_round)
        add_result(2, "Dan", round: final_round)
        add_result(3, "Steven", round: final_round)

        text = helper.winners(competition, Event.c_find("333"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with an average of 9.99 seconds in the 3x3x3 Cube event. " \
                           "[Dan](#{person_url('2006YOYO02')}) finished second (9.99) and " \
                           "[Steven](#{person_url('2006YOYO03')}) finished third (9.99)."
      end

      it "handles only 2 people in final" do
        add_result(1, "Jeremy", round: final_round)
        add_result(2, "Dan", round: final_round)

        text = helper.winners(competition, Event.c_find("333"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with an average of 9.99 seconds in the 3x3x3 Cube event. " \
                           "[Dan](#{person_url('2006YOYO02')}) finished second (9.99)."
      end

      it "handles only 1 person in final" do
        add_result(1, "Jeremy", round: final_round)

        text = helper.winners(competition, Event.c_find("333"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with an average of 9.99 seconds in the 3x3x3 Cube event."
      end

      it "handles DNF averages in the podium" do
        add_result(1, "Jeremy", round: final_round)
        add_result(2, "Dan", round: final_round)
        add_result(3, "Steven", dnf: true, round: final_round)

        text = helper.winners(competition, Event.c_find("333"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with an average of 9.99 seconds in the 3x3x3 Cube event. " \
                           "[Dan](#{person_url('2006YOYO02')}) finished second (9.99) and " \
                           "[Steven](#{person_url('2006YOYO03')}) finished third (with a single solve of 9.99 seconds)."
      end

      it "handles ties in the podium" do
        add_result(1, "Jeremy", round: final_round)
        add_result(1, "Dan", wca_id: "2006DADA01", round: final_round)
        add_result(3, "Steven", dnf: true, round: final_round)

        text = helper.winners(competition, Event.c_find("333"))
        expect(text).to eq "[Dan](#{person_url('2006DADA01')}) and [Jeremy](#{person_url('2006YOYO01')}) won with an average of 9.99 seconds in the 3x3x3 Cube event. " \
                           "[Steven](#{person_url('2006YOYO03')}) finished third (with a single solve of 9.99 seconds)."
      end

      it "handles tied third place" do
        add_result(1, "Jeremy", round: final_round)
        add_result(2, "Dan", round: final_round)
        add_result(3, "Steven", dnf: true, round: final_round)
        add_result(3, "John", dnf: true, wca_id: "2006JOJO03", round: final_round)

        text = helper.winners(competition, Event.c_find("333"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with an average of 9.99 seconds in the 3x3x3 Cube event. " \
                           "[Dan](#{person_url('2006YOYO02')}) finished second (9.99) and " \
                           "[John](#{person_url('2006JOJO03')}) and [Steven](#{person_url('2006YOYO03')}) finished third (with a single solve of 9.99 seconds)."
      end
    end

    context "333bf" do
      def add_result(pos, name, round: nil)
        person = create(:person,
                        wca_id: "2006YOYO#{format('%.2d', pos)}",
                        name: name,
                        country_id: "USA")
        create(:result,
               pos: pos,
               person: person,
               competition_id: competition.id,
               event_id: "333bf",
               round_type_id: "f",
               format_id: "3",
               round: round,
               value1: 60.seconds.in_centiseconds,
               value2: 60.seconds.in_centiseconds,
               value3: 60.seconds.in_centiseconds,
               value4: 0,
               value5: 0,
               best: 60.seconds.in_centiseconds,
               average: 60.seconds.in_centiseconds)
      end

      let(:final_round) { create(:round, competition: competition, format_id: "3", event_id: "333bf") }

      it "announces top 3 in final" do
        add_result(1, "Jeremy", round: final_round)
        add_result(2, "Dan", round: final_round)
        add_result(3, "Steven", round: final_round)

        text = helper.winners(competition, Event.c_find("333bf"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with a single solve of 1:00.00 in the 3x3x3 Blindfolded event. " \
                           "[Dan](#{person_url('2006YOYO02')}) finished second (1:00.00) and " \
                           "[Steven](#{person_url('2006YOYO03')}) finished third (1:00.00)."
      end
    end

    context "333fm" do
      def add_result(pos, name, dnf: false, round: nil)
        person = create(:person,
                        wca_id: "2006YOYO#{format('%.2d', pos)}",
                        name: name,
                        country_id: "USA")
        create(:result,
               pos: pos,
               person: person,
               competition_id: competition.id,
               event_id: "333fm",
               round_type_id: "f",
               format_id: "m",
               round: round,
               value1: dnf ? SolveTime::DNF_VALUE : 29,
               value2: 24,
               value3: 30,
               value4: 0,
               value5: 0,
               best: 24,
               average: dnf ? SolveTime::DNF_VALUE : 2767)
      end

      let(:final_round) { create(:round, competition: competition, format_id: "m", event_id: "333fm") }

      it "announces top 3 in final" do
        add_result(1, "Jeremy", round: final_round)
        add_result(2, "Dan", round: final_round)
        add_result(3, "Steven", round: final_round)

        text = helper.winners(competition, Event.c_find("333fm"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with a mean of 27.67 moves in the 3x3x3 Fewest Moves event. " \
                           "[Dan](#{person_url('2006YOYO02')}) finished second (27.67) and " \
                           "[Steven](#{person_url('2006YOYO03')}) finished third (27.67)."
      end

      it "handles DNF averages in the podium" do
        add_result(1, "Jeremy", round: final_round)
        add_result(2, "Dan", round: final_round)
        add_result(3, "Steven", dnf: true, round: final_round)

        text = helper.winners(competition, Event.c_find("333fm"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with a mean of 27.67 moves in the 3x3x3 Fewest Moves event. " \
                           "[Dan](#{person_url('2006YOYO02')}) finished second (27.67) and " \
                           "[Steven](#{person_url('2006YOYO03')}) finished third (with a single solve of 24 moves)."
      end
    end

    context "333mbf" do
      def add_result(pos, name, round: nil)
        solve_time = SolveTime.new("333mbf", :best, 0)
        solve_time.attempted = 9
        solve_time.solved = 8
        solve_time.time_centiseconds = (45.minutes + 32.seconds).in_centiseconds
        person = create(:person,
                        wca_id: "2006YOYO#{format('%.2d', pos)}",
                        name: name,
                        country_id: "USA")
        create(:result,
               pos: pos,
               person: person,
               competition_id: competition.id,
               event_id: "333mbf",
               round_type_id: "f",
               format_id: "3",
               round: round,
               value1: solve_time.wca_value,
               value2: solve_time.wca_value,
               value3: solve_time.wca_value,
               value4: 0,
               value5: 0,
               best: solve_time.wca_value,
               average: 0)
      end

      let(:final_round) { create(:round, competition: competition, format_id: "3", event_id: "333mbf") }

      it "announces top 3 in final" do
        add_result(1, "Jeremy", round: final_round)
        add_result(2, "Dan", round: final_round)
        add_result(3, "Steven", round: final_round)

        text = helper.winners(competition, Event.c_find("333mbf"))
        expect(text).to eq "[Jeremy](#{person_url('2006YOYO01')}) won with a result of 8/9 45:32 in the 3x3x3 Multi-Blind event. " \
                           "[Dan](#{person_url('2006YOYO02')}) finished second (8/9 45:32) and " \
                           "[Steven](#{person_url('2006YOYO03')}) finished third (8/9 45:32)."
      end
    end
  end
end
