# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
PV = RV::PersonsValidator

RSpec.describe PV do
  context "on InboxResult and Result" do
    let!(:competition1) { FactoryBot.create(:competition, :past, event_ids: ["333oh"]) }
    let!(:competition2) { FactoryBot.create(:competition, :past, event_ids: ["222"]) }

    # The idea behind this variable is the following: the validator can be applied
    # on either a particular model for given competition ids, or on a set of results.
    # We simply want to check it has the expected behavior on all the possible cases.
    let(:validator_args) {
      [InboxResult, Result].flat_map { |model|
        [
          { competition_ids: [competition1.id, competition2.id], model: model },
          { results: model.sorted_for_competitions([competition1.id, competition2.id]), model: model },
        ]
      }
    }

    context "validations on both Inbox and actual results" do
      it "doesn't complain when it's fine" do
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          FactoryBot.create_list(result_kind, 10, competition: competition1, eventId: "333oh")
          FactoryBot.create_list(result_kind, 10, competition: competition2, eventId: "222")
        end

        validator_args.each do |arg|
          pv = PV.new.validate(**arg)
          expect(pv.warnings).to be_empty
          expect(pv.errors).to be_empty
        end
      end

      # Triggers:
      # RESULTS_WITHOUT_PERSON_ERROR
      it "complains about missing person for result" do
        expected_errors = {
          "Result" => [],
          "InboxResult" => [],
        }
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          res1 = FactoryBot.create(result_kind, competition: competition1,
                                                eventId: "333oh")
          res1.person.delete
          expected_errors[model.to_s] = [
            RV::ValidationError.new(:persons, competition1.id,
                                    PV::RESULTS_WITHOUT_PERSON_ERROR,
                                    person_id: res1.personId),
          ]
        end
        validator_args.each do |arg|
          pv = PV.new.validate(**arg)
          expect(pv.warnings).to be_empty
          expect(pv.errors).to match_array(expected_errors[arg[:model].to_s])
        end
      end
    end

    context "validation of inbox person data" do
      # Triggers
      # SAME_PERSON_NAME_WARNING
      # SIMILAR_NAME_SAME_DOB_WARNING
      # NON_MATCHING_DOB_WARNING
      # NON_MATCHING_GENDER_WARNING
      # NON_MATCHING_NAME_WARNING
      # NON_MATCHING_COUNTRY_WARNING
      it "validates against existing person data" do
        person = FactoryBot.create(:person, countryId: "Spain")
        dup_name = FactoryBot.create(:inbox_person, name: person.name, competitionId: competition1.id)
        sim_name = FactoryBot.create(:inbox_person, dob: person.dob, name: "#{person.name.split.first} #{Faker::Name.middle_name} #{person.name.split.last}", competitionId: competition1.id)
        FactoryBot.create(:inbox_result,
                          person: dup_name, competition: competition1,
                          eventId: "333oh")
        res1 = FactoryBot.create(:inbox_result,
                                 :for_existing_person,
                                 real_person: person,
                                 competition: competition2, eventId: "222")
        res1.person.update(dob: 90.years.ago, gender: "a", name: "Hey", countryId: "FR")

        expected_warnings = [
          RV::ValidationWarning.new(:persons, competition1.id,
                                    PV::SAME_PERSON_NAME_WARNING,
                                    name: person.name, wca_ids: person.wca_id),
          RV::ValidationWarning.new(:persons, competition1.id,
                                    PV::SIMILAR_NAME_SAME_DOB_WARNING,
                                    name: sim_name.name, db_persons: "#{person.name} (#{person.wca_id})",
          RV::ValidationWarning.new(:persons, competition2.id,
                                    PV::NON_MATCHING_DOB_WARNING,
                                    name: res1.person.name, wca_id: person.wca_id,
                                    expected_dob: person.dob,
                                    dob: res1.person.dob),
          RV::ValidationWarning.new(:persons, competition2.id,
                                    PV::NON_MATCHING_NAME_WARNING,
                                    name: res1.person.name, wca_id: person.wca_id,
                                    expected_name: person.name),
          RV::ValidationWarning.new(:persons, competition2.id,
                                    PV::NON_MATCHING_GENDER_WARNING,
                                    name: res1.person.name, wca_id: person.wca_id,
                                    expected_gender: person.gender,
                                    gender: res1.person.gender),
          RV::ValidationWarning.new(:persons, competition2.id,
                                    PV::NON_MATCHING_COUNTRY_WARNING,
                                    name: res1.person.name, wca_id: person.wca_id,
                                    expected_country: person.country.iso2,
                                    country: res1.person.country.iso2),
        ]
        validator_args = [
          { competition_ids: [competition1.id, competition2.id], model: InboxResult },
          { results: InboxResult.sorted_for_competitions([competition1.id, competition2.id]), model: InboxResult },
        ]
        validator_args.each do |arg|
          pv = PV.new.validate(**arg)
          expect(pv.errors).to be_empty
          expect(pv.warnings).to match_array(expected_warnings)
        end
      end

      # Triggers:
      # PERSON_WITHOUT_RESULTS_ERROR
      # WRONG_WCA_ID_ERROR
      # WRONG_PARENTHESIS_FORMAT_ERROR
      # DOB_0101_WARNING
      # VERY_YOUNG_PERSON_WARNING
      # NOT_SO_YOUNG_PERSON_WARNING
      # EMPTY_GENDER_WARNING
      # WHITESPACE_IN_NAME_ERROR
      # WRONG_PARENTHESIS_TYPE_ERROR
      # MULTIPLE_NEWCOMERS_WITH_SAME_NAME_WARNING
      it "validates person data" do
        FactoryBot.create(:inbox_result, competition: competition2, eventId: "222")
        res1 = FactoryBot.create(:inbox_result, competition: competition2, eventId: "222")
        res1.delete

        res0101 = FactoryBot.create(:inbox_result,
                                    competition: competition1, eventId: "333oh")
        # To the person reading that in 2100: haha, enjoy my 80+ years old joke :)
        # Just bump that date to make the "not_so_young" warning go away.
        res0101.person.update(dob: Date.new(2000, 1, 1))
        res_too_young = FactoryBot.create(:inbox_result,
                                          competition: competition1,
                                          eventId: "333oh")
        res_too_young.person.update(dob: 2.years.ago)
        res_not_young = FactoryBot.create(:inbox_result,
                                          competition: competition1,
                                          eventId: "333oh")
        res_not_young.person.update(dob: 101.years.ago)
        res_whitespace = FactoryBot.create(:inbox_result,
                                           competition: competition1,
                                           eventId: "333oh")
        res_whitespace.person.update(name: "Hey(  There)", gender: nil)
        res_bad_parenthesis = FactoryBot.create(:inbox_result,
                                                competition: competition1,
                                                eventId: "333oh")
        res_bad_parenthesis.person.update(name: "Bad Parenthesis Guy（test）")
        res_same_name1 = FactoryBot.create(:inbox_result,
                                           competition: competition1,
                                           eventId: "333oh")
        res_same_name1.person.update(name: "Tester")
        res_same_name2 = FactoryBot.create(:inbox_result,
                                           competition: competition1,
                                           eventId: "333oh")
        res_same_name2.person.update(name: "Tester")
        res_wrong_wca_id = FactoryBot.create(:inbox_result,
                                             competition: competition1,
                                             eventId: "333oh")
        res_wrong_wca_id.person.update(wcaId: "ERR")

        expected_errors = [
          RV::ValidationError.new(:persons, competition2.id,
                                  PV::PERSON_WITHOUT_RESULTS_ERROR,
                                  person_name: res1.person.name,
                                  person_id: res1.person.id),
          RV::ValidationError.new(:persons, competition1.id,
                                  PV::WHITESPACE_IN_NAME_ERROR,
                                  name: res_whitespace.person.name),
          RV::ValidationError.new(:persons, competition1.id,
                                  PV::WRONG_WCA_ID_ERROR,
                                  name: res_wrong_wca_id.person.name,
                                  wca_id: res_wrong_wca_id.person.wca_id),
          RV::ValidationError.new(:persons, competition1.id,
                                  PV::WRONG_PARENTHESIS_FORMAT_ERROR,
                                  name: res_whitespace.person.name),
          RV::ValidationError.new(:persons, competition1.id,
                                  PV::WRONG_PARENTHESIS_TYPE_ERROR,
                                  name: res_bad_parenthesis.person.name),
        ]
        expected_warnings = [
          RV::ValidationWarning.new(:persons, competition1.id,
                                    PV::DOB_0101_WARNING,
                                    name: res0101.person.name),
          RV::ValidationWarning.new(:persons, competition1.id,
                                    PV::VERY_YOUNG_PERSON_WARNING,
                                    name: res_too_young.person.name),
          RV::ValidationWarning.new(:persons, competition1.id,
                                    PV::NOT_SO_YOUNG_PERSON_WARNING,
                                    name: res_not_young.person.name),
          RV::ValidationWarning.new(:persons, competition1.id,
                                    PV::EMPTY_GENDER_WARNING,
                                    name: res_whitespace.person.name),
          RV::ValidationWarning.new(:persons, competition1.id,
                                    PV::MULTIPLE_NEWCOMERS_WITH_SAME_NAME_WARNING,
                                    name: res_same_name1.person.name),
        ]
        validator_args = [
          { competition_ids: [competition1.id, competition2.id], model: InboxResult },
          { results: InboxResult.sorted_for_competitions([competition1.id, competition2.id]), model: InboxResult },
        ]
        validator_args.each do |arg|
          pv = PV.new.validate(**arg)
          expect(pv.errors).to match_array(expected_errors)
          expect(pv.warnings).to match_array(expected_warnings)
        end
      end
    end
  end
end
