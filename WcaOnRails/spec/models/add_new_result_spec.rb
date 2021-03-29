# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AddNewResult do
  let(:competition) { FactoryBot.create(:competition, :with_results) }
  let(:round) { FactoryBot.create(:round, competition: competition, event_id: "333") }
  let(:person) { FactoryBot.create(:person_who_has_competed_once) }
  let(:add_new_result_returner) { AddNewResult.new(
    is_new_competitor: "0",
    competitor_id: person.wca_id,
    competition_id: competition.id,
    event_id: "333",
    round_id: round.id,
    value1: 1400,
    value2: 1500,
    value3: 1500,
    value4: 1500,
    value5: -1
  ) }
  let(:add_new_result_new_competitor) { AddNewResult.new(
    is_new_competitor: "1",
    name: "Billy Bob",
    country_id: "USA",
    dob: "2000-04-20",
    gender: "m",
    semi_id: "2019BOBB",
    competition_id: competition.id,
    event_id: "333",
    round_id: round.id,
    value1: 1400,
    value2: 1500,
    value3: 1500,
    value4: 1500,
    value5: -1
  ) }

  it "is valid" do
    expect(add_new_result_returner).to be_valid
    expect(add_new_result_new_competitor).to be_valid
  end

  it "handles invalid competition_id" do
    add_new_result_returner.competition_id = ""
    expect(add_new_result_returner).to be_invalid_with_errors(competition_id: ["can't be blank"])

    add_new_result_returner.competition_id = "bad competition id"
    expect(add_new_result_returner).to be_invalid_with_errors(competition_id: ["Not found"])
  end

  it "handles invalid event_id" do
    add_new_result_returner.event_id = ""
    expect(add_new_result_returner).to be_invalid_with_errors(event_id: ["can't be blank"])

    add_new_result_returner.event_id = "333mbfo"
    expect(add_new_result_returner).to be_invalid_with_errors(event_id: ["Not found for competition"])
  end

  it "handles invalid round_id" do
    add_new_result_returner.round_id = ""
    expect(add_new_result_returner).to be_invalid_with_errors(round_id: ["can't be blank"])

    add_new_result_returner.round_id = 2147483647
    expect(add_new_result_returner).to be_invalid_with_errors(round_id: ["Not found for competition"])
  end

  it "handles requiring value1" do
    add_new_result_returner.value1 = ""
    expect(add_new_result_returner).to be_invalid_with_errors(value1: ["can't be blank"])
  end

  it "handles invalid competitor_id if returning" do
    add_new_result_returner.competitor_id = ""
    expect(add_new_result_returner).to be_invalid_with_errors(competitor_id: ["can't be blank"])

    add_new_result_returner.competitor_id = "bad wca id"
    expect(add_new_result_returner).to be_invalid_with_errors(competitor_id: ["Not found"])
  end

  it "handles invalid name if new competitor" do
    add_new_result_new_competitor.name = ""
    expect(add_new_result_new_competitor).to be_invalid_with_errors(name: ["can't be blank"])
  end

  it "handles invalid country_id if new competitor" do
    add_new_result_new_competitor.country_id = ""
    expect(add_new_result_new_competitor).to be_invalid_with_errors(country_id: ["can't be blank"])

    add_new_result_new_competitor.country_id = "Bad country"
    expect(add_new_result_new_competitor).to be_invalid_with_errors(country_id: ["Not found"])
  end

  it "handles invalid gender if new competitor" do
    add_new_result_new_competitor.gender = ""
    expect(add_new_result_new_competitor).to be_invalid_with_errors(gender: ["can't be blank"])

    add_new_result_new_competitor.gender = "Bad gender"
    expect(add_new_result_new_competitor).to be_invalid_with_errors(gender: ["Not found"])
  end

  it "handles blank dob as valid if new competitor" do
    add_new_result_new_competitor.dob = ""
    expect(add_new_result_new_competitor).to be_valid
  end

  it "handles invalid dob if new competitor" do
    add_new_result_new_competitor.dob = "April 20th 2000"
    expect(add_new_result_new_competitor).to be_invalid_with_errors(dob: ["Invalid. Must be YYYY-MM-DD"])

    add_new_result_new_competitor.dob = "2000-01-32"
    expect(add_new_result_new_competitor).to be_invalid_with_errors(dob: ["Invalid. Must be YYYY-MM-DD"])

    add_new_result_new_competitor.dob = 1.year.from_now.strftime("%F")
    expect(add_new_result_new_competitor).to be_invalid_with_errors(dob: ["Must be in the past"])
  end

  it "handles invalid semi_id if new competitor" do
    add_new_result_new_competitor.semi_id = ""
    expect(add_new_result_new_competitor).to be_invalid_with_errors(semi_id: ["can't be blank"])

    add_new_result_new_competitor.semi_id = "Bad semi_id"
    expect(add_new_result_new_competitor).to be_invalid_with_errors(semi_id: ["Invalid. Must be YYYYLAST"])
  end

  it "requires competition to have results" do
    new_competition = FactoryBot.create(:competition)
    add_new_result_returner.competition_id = new_competition.id
    expect(add_new_result_returner).to be_invalid_with_errors(competition_id: ["Does not have results"])
  end

  it "requires competitor to not have already competed in the round" do
    add_new_result_returner.do_add_new_result
    expect(add_new_result_returner).to be_invalid_with_errors(round_id: ["Competitor currently has results for this round. To fix them use the Fix Results script"])
  end

  it "requires valid values" do
    add_new_result_returner.value1 = "-3"
    add_new_result_returner.value2 = "-3"
    add_new_result_returner.value3 = "-3"
    add_new_result_returner.value4 = "-3"
    add_new_result_returner.value5 = "-3"
    expect(add_new_result_returner).to be_invalid_with_errors(value1: ["Not Valid"])
    expect(add_new_result_returner).to be_invalid_with_errors(value2: ["Not Valid"])
    expect(add_new_result_returner).to be_invalid_with_errors(value3: ["Not Valid"])
    expect(add_new_result_returner).to be_invalid_with_errors(value4: ["Not Valid"])
    expect(add_new_result_returner).to be_invalid_with_errors(value5: ["Not Valid"])
  end

  describe "create_new_person" do
    it "creates a new competitor if new competitor" do
      expect(add_new_result_new_competitor).to be_valid
      num_people_before = Person.all.length
      add_new_result_new_competitor.create_new_person
      expect(num_people_before + 1).to eq Person.all.length
    end
    it "does not create a new competitor if returner" do
      expect(add_new_result_returner).to be_valid
      num_people_before = Person.all.length
      add_new_result_returner.create_new_person
      expect(num_people_before).to eq Person.all.length
    end
  end

  it "can do add new result" do
    response = add_new_result_new_competitor.do_add_new_result
    expect(!!response).to eq true
    expect(response[:error]).to be_nil
    expect(response[:wca_id]).to be_truthy
    expect(Person.find_by_wca_id(response[:wca_id]).results).to be_truthy
  end
end