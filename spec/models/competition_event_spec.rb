# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionEvent do
  let(:competition) { create(:competition, event_ids: %w[333 444]) }
  let(:competition_event) { competition.competition_events.find_by(event_id: "333") }

  it "it's okay if there are no rounds yet" do
    expect(competition_event).to be_valid
  end

  context "number" do
    it "must start at 1" do
      build_rounds([3])
      expect(competition_event).to be_invalid_with_errors(rounds: ["[3] is wrong"])
    end

    it "must be contiguous" do
      build_rounds([1, 3])
      expect(competition_event).to be_invalid_with_errors(rounds: ["[1, 3] is wrong"])
    end

    it "cannot have duplicates" do
      build_rounds([1, 2, 2, 3])
      expect(competition_event).to be_invalid_with_errors(rounds: ["[1, 2, 2, 3] is wrong"])
    end

    it "cannot remove a round in the middle" do
      build_rounds([1, 2, 3])
      competition_event.save!
      expect(competition_event.rounds.length).to eq 3

      mark_rounds_for_destruction([2])
      expect(competition_event).to be_invalid_with_errors(rounds: ["[1, 3] is wrong"])
    end
  end

  context "qualifications" do
    let(:user) { create(:user_with_wca_id) }
    let(:first_competition) do
      create(
        :competition,
        start_date: '2021-02-01',
        end_date: '2021-02-01',
      )
    end
    let(:second_competition) do
      create(
        :competition,
        start_date: '2021-03-01',
        end_date: '2021-03-02',
      )
    end

    let!(:first_333_result) do
      create(
        :result,
        person_id: user.wca_id,
        competition: first_competition,
        event_id: '333',
        best: 1200,
        average: 1500,
      )
    end
    let!(:second_333_result) do
      create(
        :result,
        person_id: user.wca_id,
        competition: second_competition,
        event_id: '333',
        best: 1100,
        average: 1200,
      )
    end
    let!(:first_oh_result_no_single) do
      create(
        :result,
        person_id: user.wca_id,
        competition: first_competition,
        event_id: '333oh',
        best: -1,
        average: -1,
      )
    end
    let!(:second_oh_result) do
      create(
        :result,
        person_id: user.wca_id,
        competition: second_competition,
        event_id: '333oh',
        best: 1700,
        average: 2000,
      )
    end
    let!(:first_444_result_no_average) do
      create(
        :result,
        person_id: user.wca_id,
        competition: first_competition,
        event_id: '444',
        best: 4500,
        average: -1,
      )
    end
    let!(:second_444_result) do
      create(
        :result,
        person_id: user.wca_id,
        competition: second_competition,
        event_id: '444',
        best: 4500,
        average: 4800,
      )
    end

    context "Single" do
      context "requires a successful time for ranking" do
        let(:qualification) { ResultConditions::Ranking.new(scope: 'single', value: 50) }

        it "has a qualifying result" do
          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_333.meets_qualification?(user)).to be true
        end

        it "has not achieved a qualifying result yet" do
          competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_333oh.meets_qualification?(user)).to be false
        end

        it "later achieves a qualifying result in time for the deadline" do
          competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
          expect(competition_event_333oh.meets_qualification?(user)).to be true
        end
      end

      context "requires any successful time for resultAchieved" do
        let(:qualification) { ResultConditions::ResultAchieved.new(scope: 'single', value: nil) }

        it "has achieved a result before" do
          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_333.meets_qualification?(user)).to be true
        end

        it "has not achieved a result in that event yet" do
          competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_333oh.meets_qualification?(user)).to be false
        end

        it "later achieves a result in that event" do
          competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
          expect(competition_event_333oh.meets_qualification?(user)).to be true
        end
      end

      context "requires strictly less than for resultAchieved" do
        it "has matched but NOT strictly beaten the qualifying time" do
          qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: 1200)

          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_333.meets_qualification?(user)).to be false
        end

        it "has strictly beaten the qualifying time" do
          qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: 1201)

          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_333.meets_qualification?(user)).to be true
        end
      end

      context "supports achieving results on qualification date" do
        let(:qualification) { ResultConditions::ResultAchieved.new(scope: 'single', value: 1150) }

        it "has achieved a qualifying time before the latest date" do
          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-03-03')
          expect(competition_event_333.meets_qualification?(user)).to be true
        end

        it "has achieved a qualifying time exactly on the latest date" do
          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-03-02')
          expect(competition_event_333.meets_qualification?(user)).to be true
        end

        it "has achieved a qualifying time but one day too late" do
          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-03-01')
          expect(competition_event_333.meets_qualification?(user)).to be false
        end
      end
    end

    context "Average" do
      context "requires a successful time for ranking" do
        let(:qualification) { ResultConditions::Ranking.new(scope: 'average', value: 50) }

        it "has not achieved a qualifying result yet" do
          competition_event_444 = CompetitionEvent.new(event_id: '444', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_444.meets_qualification?(user)).to be false
        end

        it "later achieves a qualifying result in time for the deadline" do
          competition_event_444 = CompetitionEvent.new(event_id: '444', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
          expect(competition_event_444.meets_qualification?(user)).to be true
        end
      end

      context "requires a successful time for resultAchieved" do
        let(:qualification) { ResultConditions::ResultAchieved.new(scope: 'average', value: nil) }

        it "has not achieved a result in that event yet" do
          competition_event_444 = CompetitionEvent.new(event_id: '444', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_444.meets_qualification?(user)).to be false
        end

        it "has already achieved a result in that event" do
          competition_event_444 = CompetitionEvent.new(event_id: '444', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
          expect(competition_event_444.meets_qualification?(user)).to be true
        end
      end

      context "requires strictly less than for resultAchieved" do
        it "has matched but NOT strictly beaten the qualifying time" do
          qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: 1500)

          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_333.meets_qualification?(user)).to be false
        end

        it "has strictly beaten the qualifying time" do
          qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: 1501)

          competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
          expect(competition_event_333.meets_qualification?(user)).to be true
        end
      end

      context "supports achieving result on qualification date" do
        let(:qualification) { ResultConditions::ResultAchieved.new(scope: 'average', value: 2500) }

        it "has achieved a qualifying time before the latest date" do
          competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-03')
          expect(competition_event_333oh.meets_qualification?(user)).to be true
        end

        it "has achieved a qualifying time exactly on the latest date" do
          competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-02')
          expect(competition_event_333oh.meets_qualification?(user)).to be true
        end

        it "has achieved a qualifying time but one day too late" do
          competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-01')
          expect(competition_event_333oh.meets_qualification?(user)).to be false
        end
      end
    end
  end

  def build_rounds(round_numbers)
    competition_event.rounds_attributes = round_numbers.map { |n| attributes_for(:round, competition_event: competition_event, number: n, total_number_of_rounds: round_numbers.size) }
  end

  def mark_rounds_for_destruction(round_numbers)
    competition_event.rounds_attributes = competition_event.rounds.map do |round|
      { id: round.id, _destroy: round_numbers.include?(round.number) }
    end
  end
end
