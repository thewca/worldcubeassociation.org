require 'rails_helper'

RSpec.describe Person, type: :model do
  let!(:person) { FactoryGirl.create :person_who_has_competed_once }

  it "defines a valid person" do
    expect(person).to be_valid
  end

  context "likely_delegates" do
    it "never competed" do
      person = FactoryGirl.create :person
      expect(person.likely_delegates).to eq []
    end

    it "works" do
      competition = person.competitions.first
      delegate = competition.delegates.first
      expect(person.likely_delegates).to eq [delegate]

      competition2 = FactoryGirl.create :competition, delegates: [delegate]
      FactoryGirl.create :result, person: person, competitionId: competition2.id
      expect(person.likely_delegates).to eq [delegate]

      new_delegate = FactoryGirl.create :delegate
      competition3 = FactoryGirl.create :competition, delegates: [new_delegate]
      FactoryGirl.create :result, person: person, competitionId: competition3.id
      expect(person.likely_delegates).to eq [delegate, new_delegate]
    end
  end
end
