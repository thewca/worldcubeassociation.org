require 'rails_helper'

RSpec.describe Person, type: :model do
  let!(:person) { FactoryGirl.create :person }
  let!(:delegate) { FactoryGirl.create :delegate }
  let!(:competition) { FactoryGirl.create :competition, delegates: [delegate] }
  let!(:results1) { FactoryGirl.create :result, person: person, competitionId: competition.id }
  let!(:results2) { FactoryGirl.create :result, person: person, competitionId: competition.id }

  it "defines a valid person" do
    expect(person).to be_valid
  end

  it "finds results" do
    expect(person.results.order(:id)).to eq [ results1, results2 ]
  end

  it "finds competitions" do
    expect(person.competitions).to eq [ competition ]
  end

  context "likey_delegates" do
    it "never competed" do
      person = FactoryGirl.create :person
      expect(person.likely_delegates).to eq []
    end

    it "works" do
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
