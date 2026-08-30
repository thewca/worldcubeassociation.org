# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompetitionEvent do
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
    it "requires a successful time for ranking" do
      qualification = ResultConditions::Ranking.new(scope: 'single', value: 50)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_333.meets_qualification?(user)).to be true
      competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_333oh.meets_qualification?(user)).to be false

      qualification = ResultConditions::Ranking.new(scope: 'single', value: 50)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
      expect(competition_event_333.meets_qualification?(user)).to be true
      competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
      expect(competition_event_333oh.meets_qualification?(user)).to be true
    end

    it "requires a successful time for anyResult" do
      qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: nil)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_333.meets_qualification?(user)).to be true
      competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_333oh.meets_qualification?(user)).to be false

      qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: nil)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
      expect(competition_event_333.meets_qualification?(user)).to be true
      competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
      expect(competition_event_333oh.meets_qualification?(user)).to be true
    end

    it "requires strictly less than for attemptResult" do
      qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: 1200)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_333.meets_qualification?(user)).to be false

      qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: 1201)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_333.meets_qualification?(user)).to be true
    end

    # User's qualifying result was achieved on the 2nd
    it "requires end date before" do
      # Result must be achieved by the 3rd - user qualifies because result achieved before whenDate
      qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: 1150)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-03-03')
      expect(competition_event_333.meets_qualification?(user)).to be true

      # Result must be achieved by the 2nd - user qualifies because result achieved on whenDate
      qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: 1150)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-03-02')
      expect(competition_event_333.meets_qualification?(user)).to be true

      # Result must be achieved by the 1st - user does not qualify because result achieved after whenDate
      qualification = ResultConditions::ResultAchieved.new(scope: 'single', value: 1150)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-03-01')
      expect(competition_event_333.meets_qualification?(user)).to be false
    end
  end

  context "Average" do
    it "requires a successful time for ranking" do
      qualification = ResultConditions::Ranking.new(scope: 'average', value: 50)
      expect(qualification).to be_valid
      competition_event_444 = CompetitionEvent.new(event_id: '444', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_444.meets_qualification?(user)).to be false

      qualification = ResultConditions::Ranking.new(scope: 'average', value: 50)
      expect(qualification).to be_valid
      competition_event_444 = CompetitionEvent.new(event_id: '444', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
      expect(competition_event_444.meets_qualification?(user)).to be true
    end

    it "requires a successful time for anyResult" do
      qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: nil)
      expect(qualification).to be_valid
      competition_event_444 = CompetitionEvent.new(event_id: '444', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_444.meets_qualification?(user)).to be false

      qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: nil)
      expect(qualification).to be_valid
      competition_event_444 = CompetitionEvent.new(event_id: '444', qualification_condition: qualification, qualification_latest_date: '2021-03-15')
      expect(competition_event_444.meets_qualification?(user)).to be true
    end

    it "requires strictly less than for attemptResult" do
      qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: 1500)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_333.meets_qualification?(user)).to be false

      qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: 1501)
      expect(qualification).to be_valid
      competition_event_333 = CompetitionEvent.new(event_id: '333', qualification_condition: qualification, qualification_latest_date: '2021-02-15')
      expect(competition_event_333.meets_qualification?(user)).to be true
    end

    # User's qualifying result was achieved on the 2nd
    it "supports achieving result on qualification date" do
      # Result must be achieved by the 3rd - user qualifies because result achieved before whenDate
      qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: 2500)
      expect(qualification).to be_valid
      competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-03')
      expect(competition_event_333oh.meets_qualification?(user)).to be true

      # Result must be achieved by the 2nd - user qualifies because result achieved on whenDate
      qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: 2500)
      expect(qualification).to be_valid
      competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-02')
      expect(competition_event_333oh.meets_qualification?(user)).to be true

      # Result must be achieved by the 1st - user does not qualify because result achieved after whenDate
      qualification = ResultConditions::ResultAchieved.new(scope: 'average', value: 2500)
      expect(qualification).to be_valid
      competition_event_333oh = CompetitionEvent.new(event_id: '333oh', qualification_condition: qualification, qualification_latest_date: '2021-03-01')
      expect(competition_event_333oh.meets_qualification?(user)).to be false
    end
  end
end
