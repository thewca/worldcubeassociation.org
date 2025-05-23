# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Person do
  let!(:person) { create(:person_who_has_competed_once) }

  it "defines a valid person" do
    expect(person).to be_valid
  end

  context "likely_delegates" do
    it "never competed" do
      person = create(:person)
      expect(person.likely_delegates).to eq []
    end

    it "works" do
      competition = person.competitions.first
      delegate = competition.delegates.first
      expect(person.likely_delegates).to eq [delegate]

      competition2 = create(:competition, delegates: [delegate], starts: 3.days.ago)
      create(:result, person: person, competition_id: competition2.id)
      expect(person.likely_delegates).to eq [delegate]

      new_delegate = create(:delegate)
      competition3 = create(:competition, delegates: [new_delegate], starts: 2.days.ago)
      create(:result, person: person, competition_id: competition3.id)
      expect(person.likely_delegates).to eq [delegate, new_delegate]
    end
  end

  describe "updating the data" do
    let!(:person) { create(:person_who_has_competed_once, name: "Feliks Zemdegs", country_id: "Australia") }
    let!(:user) { create(:user_with_wca_id, person: person) }

    context "fixing the person" do
      it "fixing country_id fails if there exists an old person with the same wca id, greater sub_id and the same country_id" do
        create(:person, wca_id: person.wca_id, sub_id: 2, name: person.name, country_id: "New Zealand")
        person.country_id = "New Zealand"
        expect(person).to be_invalid_with_errors(country_id: ["Cannot change the region to a region the person has already represented in the past."])
      end

      it "updates person_name and country_id columns in the results table" do
        person.update!(name: "New Name", country_id: "New Zealand")
        expect(person.results.pluck(:person_name).uniq).to eq ["New Name"]
        expect(person.results.pluck(:country_id).uniq).to eq ["New Zealand"]
      end

      it "doesn't update person_name and countryId columns in the results table if they differ from the current ones" do
        create(:person_who_has_competed_once, wca_id: person.wca_id, sub_id: 2, name: "Old Name", country_id: "France")
        person.update!(name: "New Name", country_id: "New Zealand")
        expect(person.results.pluck(:person_name).uniq).to contain_exactly("Old Name", "New Name")
        expect(person.results.pluck(:country_id).uniq).to contain_exactly("France", "New Zealand")
      end

      it "updates the associated user" do
        person.update!(name: "New Name", country_id: "New Zealand", dob: "1990-10-10")
        expect(user.reload.name).to eq "New Name"
        expect(user.country_iso2).to eq "NZ"
        expect(user.dob).to eq Date.new(1990, 10, 10)
      end
    end

    context "updating the person using sub id" do
      it "fails if both name and country_id haven't changed" do
        person.update_using_sub_id(name: "Feliks Zemdegs")
        expect(person.errors[:base]).to eq ["The name or the region must be different to update the person."]
      end

      it "fails if both name and country_id haven't been passed" do
        person.update_using_sub_id(dob: "1990-10-10")
        expect(person.errors[:base]).to eq ["The name or the region must be different to update the person."]
      end

      it "doesn't update the results table" do
        person.update_using_sub_id(name: "New Name", country_id: "New Zealand")
        expect(person.results.pluck(:person_name).uniq).to eq ["Feliks Zemdegs"]
        expect(person.results.pluck(:country_id).uniq).to eq ["Australia"]
      end

      it "creates a new Person with sub_id equal to 2 containing the old data" do
        person.update_using_sub_id(name: "New Name", country_id: "New Zealand")
        expect(Person.where(wca_id: person.wca_id, sub_id: 2, name: "Feliks Zemdegs", country_id: "Australia")).to exist
      end

      it "updates the associated user" do
        person.update_using_sub_id(name: "New Name", country_id: "New Zealand", dob: "1990-10-10")
        expect(user.reload.name).to eq "New Name"
        expect(user.country_iso2).to eq "NZ"
        expect(user.dob).to eq Date.new(1990, 10, 10)
      end
    end

    context "updating country and then fixing name" do
      it "does not affect old results" do
        person.update_using_sub_id!(country_id: "New Zealand")
        person.update!(name: "Felix Zemdegs")
        expect(person.results.pluck(:person_name).uniq).to eq ["Feliks Zemdegs"]
        expect(person.results.pluck(:country_id).uniq).to eq ["Australia"]
      end
    end

    context "updating name and then fixing country" do
      it "does not affect old results" do
        person.update_using_sub_id!(name: "Felix Zemdegs")
        person.update!(country_id: "New Zealand")
        expect(person.results.pluck(:person_name).uniq).to eq ["Feliks Zemdegs"]
        expect(person.results.pluck(:country_id).uniq).to eq ["Australia"]
      end
    end
  end

  describe "#world_championship_podiums" do
    let!(:wc2015) { create(:competition, championship_types: ["world"], starts: Date.new(2015, 1, 1)) }
    let!(:wc2017) { create(:competition, championship_types: ["world"], starts: Date.new(2017, 1, 1)) }
    let!(:result1) { create(:result, person: person, competition: wc2015, pos: 2, event_id: "333") }
    let!(:result2) { create(:result, person: person, competition: wc2015, pos: 1, event_id: "333oh") }
    let!(:result3) { create(:result, person: person, competition: wc2017, pos: 3, event_id: "444") }

    it "return results ordered by year and event" do
      expect(person.world_championship_podiums.to_a).to eq [result3, result1, result2]
    end
  end

  describe "#championship_podiums" do
    let!(:fr_nationals2016) { create(:competition, championship_types: ["FR"], starts: Date.new(2016, 1, 1)) }
    let!(:us_nationals2017) { create(:competition, championship_types: ["US"], starts: Date.new(2017, 1, 1)) }
    let!(:fr_competitor) do
      create(:person, country_id: "France").tap do |fr_competitor|
        create(:result, person: fr_competitor, competition: fr_nationals2016, pos: 1, event_id: "333")
        create(:result, person: fr_competitor, competition: us_nationals2017, pos: 1, event_id: "333")
      end
    end
    let!(:us_competitor) do
      create(:person, country_id: "USA").tap do |us_competitor|
        create(:result, person: us_competitor, competition: us_nationals2017, pos: 2, event_id: "333")
      end
    end

    context "when a foreigner does compete" do
      it "cannot gain a champion title" do
        expect(fr_competitor.championship_podiums[:national].map(&:country_id)).to eq %w[France]
      end

      it "is ignored when computing others' position" do
        expect(us_competitor.championship_podiums[:national].first.pos).to eq 1
      end
    end

    it "ignores DNF results on the podium" do
      expect do
        create(:result, :blind_dnf_mo3, person: us_competitor, competition: us_nationals2017,
                                        pos: 2, event_id: "555bf", best: SolveTime::DNF_VALUE)
      end.not_to(change { us_competitor.championship_podiums[:national] })
    end

    context "when a person changed nationality and continent" do
      before { fr_competitor.update_using_sub_id! country_id: "USA" }

      it "includes championship titles related to the previous nationality" do
        expect(fr_competitor.championship_podiums[:national].map(&:country_id)).to eq %w[France]
      end

      it "does no longer treat the person as eligible for championship title related to previous nationality" do
        expect do
          fr_nationals2017 = create(:competition, championship_types: ["FR"], starts: Date.new(2017, 1, 1))
          create(:result, person: fr_competitor, competition: fr_nationals2017, pos: 1, event_id: "333")
        end.not_to(change { fr_competitor.championship_podiums[:national] })
      end

      it "is eligible for championship title of the current continent" do
        expect do
          na_championship2017 = create(:competition, championship_types: ["_North America"], starts: Date.new(2017, 1, 1))
          create(:result, person: fr_competitor, competition: na_championship2017, pos: 1, event_id: "333")
        end.to change { fr_competitor.championship_podiums[:continental].count }.by 1
      end
    end

    it "reassigns positions correctly in the case of a tie" do
      us_competitor1 = create(:person, country_id: "USA")
      us_competitor2 = create(:person, country_id: "USA")
      us_competitor3 = create(:person, country_id: "USA")
      create(:result, person: fr_competitor, competition: us_nationals2017, pos: 1, event_id: "222")
      create(:result, person: us_competitor1, competition: us_nationals2017, pos: 2, event_id: "222")
      create(:result, person: us_competitor2, competition: us_nationals2017, pos: 2, event_id: "222")
      create(:result, person: us_competitor3, competition: us_nationals2017, pos: 4, event_id: "222")

      expect(us_competitor1.championship_podiums[:national].first.pos).to eq 1
      expect(us_competitor2.championship_podiums[:national].first.pos).to eq 1
      expect(us_competitor3.championship_podiums[:national].first.pos).to eq 3
    end
  end
end
