# frozen_string_literal: true

require 'rails_helper'

RV = ResultsValidators
PV = RV::PersonsValidator

RSpec.describe PV do
  context "on InboxResult and Result" do
    let!(:competition1) { create(:competition, :past, event_ids: ["333oh"]) }
    let!(:competition2) { create(:competition, :past, event_ids: ["222"]) }

    # The idea behind this variable is the following: the validator can be applied
    # on either a particular model for given competition ids, or on a set of results.
    # We simply want to check it has the expected behavior on all the possible cases.
    let(:validator_args) do
      [InboxResult, Result].flat_map do |model|
        [
          { competition_ids: [competition1.id, competition2.id], model: model },
          { results: model.where(competition_id: [competition1.id, competition2.id]), model: model },
        ]
      end
    end

    context "validations on both Inbox and actual results" do
      it "doesn't complain when it's fine" do
        round_333oh = create(:round, competition: competition1, event_id: "333oh")
        round_222 = create(:round, competition: competition2, event_id: "222")
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          create_list(result_kind, 10, competition: competition1, event_id: "333oh", round: round_333oh)
          create_list(result_kind, 10, competition: competition2, event_id: "222", round: round_222)
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
        round_333oh = create(:round, competition: competition1, event_id: "333oh")
        [Result, InboxResult].each do |model|
          result_kind = model.model_name.singular.to_sym
          res1 = create(result_kind, competition: competition1,
                                     event_id: "333oh",
                                     round: round_333oh)
          res1.person.delete
          expected_errors[model.to_s] = [
            RV::ValidationError.new(PV::RESULTS_WITHOUT_PERSON_ERROR,
                                    :persons, competition1.id,
                                    person_id: res1.person_id),
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
      # NON_MATCHING_DOB_WARNING
      # NON_MATCHING_GENDER_WARNING
      # NON_MATCHING_NAME_WARNING
      # NON_MATCHING_COUNTRY_WARNING
      it "validates against existing person data" do
        person = create(:person, country_id: "Spain")
        dup_name = create(:inbox_person, name: person.name, competition_id: competition1.id)
        create(:inbox_result,
               person: dup_name, competition: competition1,
               event_id: "333oh")
        res1 = create(:inbox_result,
                      :for_existing_person,
                      real_person: person,
                      competition: competition2, event_id: "222")
        res1.person.update(dob: 90.years.ago, gender: "a", name: "Hey", country_iso2: "FR")

        expected_warnings = [
          RV::ValidationWarning.new(PV::SAME_PERSON_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: person.name, wca_ids: person.wca_id),
          RV::ValidationWarning.new(PV::NON_MATCHING_DOB_WARNING,
                                    :persons, competition2.id,
                                    name: res1.person.name, wca_id: person.wca_id,
                                    expected_dob: person.dob,
                                    dob: res1.person.dob),
          RV::ValidationWarning.new(PV::NON_MATCHING_NAME_WARNING,
                                    :persons, competition2.id,
                                    name: res1.person.name, wca_id: person.wca_id,
                                    expected_name: person.name),
          RV::ValidationWarning.new(PV::NON_MATCHING_GENDER_WARNING,
                                    :persons, competition2.id,
                                    name: res1.person.name, wca_id: person.wca_id,
                                    expected_gender: person.gender,
                                    gender: res1.person.gender),
          RV::ValidationWarning.new(PV::NON_MATCHING_COUNTRY_WARNING,
                                    :persons, competition2.id,
                                    name: res1.person.name, wca_id: person.wca_id,
                                    expected_country: person.country.iso2,
                                    country: res1.person.country.iso2),
        ]
        validator_args = [
          { competition_ids: [competition1.id, competition2.id], model: InboxResult },
          { results: InboxResult.where(competition_id: [competition1.id, competition2.id]), model: InboxResult },
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
      # SPECIAL_CHARACTERS_IN_NAME_WARNING
      # MULTIPLE_NEWCOMERS_WITH_SAME_NAME_WARNING
      # LOWERCASE_NAME_WARNING
      # UPPERCASE_NAME_WARNING
      # MISSING_PERIOD_WARNING
      # LETTER_AFTER_PERIOD_WARNING
      # SINGLE_LETTER_FIRST_OR_LAST_NAME_WARNING
      # SINGLE_NAME_WARNING
      it "validates person data" do
        round_222 = create(:round, event_id: "222", competition: competition2)
        create(:inbox_result, competition: competition2, event_id: "222", round: round_222)
        res1 = create(:inbox_result, competition: competition2, event_id: "222", round: round_222)
        res1.delete

        round_333_oh = create(:round, event_id: "333oh", competition: competition1)
        res0101 = create(:inbox_result,
                         competition: competition1, event_id: "333oh", round: round_333_oh)
        # To the person reading that in 2100: haha, enjoy my 80+ years old joke :)
        # Just bump that date to make the "not_so_young" warning go away.
        res0101.person.update(dob: Date.new(2000, 1, 1))
        res_too_young = create(:inbox_result,
                               competition: competition1,
                               event_id: "333oh",
                               round: round_333_oh)
        res_too_young.person.update(dob: 2.years.ago)
        res_not_young = create(:inbox_result,
                               competition: competition1,
                               event_id: "333oh",
                               round: round_333_oh)
        res_not_young.person.update(dob: 101.years.ago)
        res_whitespace = create(:inbox_result,
                                competition: competition1,
                                event_id: "333oh",
                                round: round_333_oh)
        res_whitespace.person.update(name: "Hey(  There)", gender: nil)
        res_bad_parenthesis = create(:inbox_result,
                                     competition: competition1,
                                     event_id: "333oh",
                                     round: round_333_oh)
        res_bad_parenthesis.person.update(name: "Bad Parenthesis Guy（test）")
        res_special_chars1 = create(:inbox_result,
                                    competition: competition1,
                                    event_id: "333oh",
                                    round: round_333_oh)
        res_special_chars1.person.update(name: "John \"Doe\"")
        res_special_chars2 = create(:inbox_result,
                                    competition: competition1,
                                    event_id: "333oh",
                                    round: round_333_oh)
        res_special_chars2.person.update(name: "Jane123 Smith")
        res_special_chars3 = create(:inbox_result,
                                    competition: competition1,
                                    event_id: "333oh",
                                    round: round_333_oh)
        res_special_chars3.person.update(name: "Bob$ Smith")
        res_lowercase1 = create(:inbox_result,
                                competition: competition1,
                                event_id: "333oh",
                                round: round_333_oh)
        res_lowercase1.person.update(name: "Yamada taro (山田太郎)")
        res_lowercase2 = create(:inbox_result,
                                competition: competition1,
                                event_id: "333oh",
                                round: round_333_oh)
        res_lowercase2.person.update(name: "ilis Xocavənd")
        res_missing_period = create(:inbox_result,
                                    competition: competition1,
                                    event_id: "333oh",
                                    round: round_333_oh)
        res_missing_period.person.update(name: "Missing A Period")
        res_single_letter = create(:inbox_result,
                                   competition: competition1,
                                   event_id: "333oh",
                                   round: round_333_oh)
        res_single_letter.person.update(name: "A. B. van der Doe")
        res_bad_period_upcase = create(:inbox_result,
                                       competition: competition1,
                                       event_id: "333oh",
                                       round: round_333_oh)
        res_bad_period_upcase.person.update(name: "David K.J. RAmsey")
        res_same_name1 = create(:inbox_result,
                                competition: competition1,
                                event_id: "333oh",
                                round: round_333_oh)
        res_same_name1.person.update(name: "Tester")
        res_same_name2 = create(:inbox_result,
                                competition: competition1,
                                event_id: "333oh",
                                round: round_333_oh)
        res_same_name2.person.update(name: "Tester")
        res_wrong_wca_id = create(:inbox_result,
                                  competition: competition1,
                                  event_id: "333oh",
                                  round: round_333_oh)
        res_wrong_wca_id.person.update(wca_id: "ERR")

        expected_errors = [
          RV::ValidationError.new(PV::PERSON_WITHOUT_RESULTS_ERROR,
                                  :persons, competition2.id,
                                  person_name: res1.person.name,
                                  person_id: res1.person.ref_id),
          RV::ValidationError.new(PV::WHITESPACE_IN_NAME_ERROR,
                                  :persons, competition1.id,
                                  name: res_whitespace.person.name),
          RV::ValidationError.new(PV::WRONG_WCA_ID_ERROR,
                                  :persons, competition1.id,
                                  name: res_wrong_wca_id.person.name,
                                  wca_id: res_wrong_wca_id.person.wca_id),
          RV::ValidationError.new(PV::WRONG_PARENTHESIS_FORMAT_ERROR,
                                  :persons, competition1.id,
                                  name: res_whitespace.person.name),
          RV::ValidationError.new(PV::WRONG_PARENTHESIS_TYPE_ERROR,
                                  :persons, competition1.id,
                                  name: res_bad_parenthesis.person.name),
        ]
        expected_warnings = [
          RV::ValidationWarning.new(PV::DOB_0101_WARNING,
                                    :persons, competition1.id,
                                    name: res0101.person.name),
          RV::ValidationWarning.new(PV::VERY_YOUNG_PERSON_WARNING,
                                    :persons, competition1.id,
                                    name: res_too_young.person.name),
          RV::ValidationWarning.new(PV::NOT_SO_YOUNG_PERSON_WARNING,
                                    :persons, competition1.id,
                                    name: res_not_young.person.name),
          RV::ValidationWarning.new(PV::EMPTY_GENDER_WARNING,
                                    :persons, competition1.id,
                                    name: res_whitespace.person.name),
          RV::ValidationWarning.new(PV::SPECIAL_CHARACTERS_IN_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_special_chars1.person.name),
          RV::ValidationWarning.new(PV::SPECIAL_CHARACTERS_IN_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_special_chars2.person.name),
          RV::ValidationWarning.new(PV::SPECIAL_CHARACTERS_IN_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_special_chars3.person.name),
          RV::ValidationWarning.new(PV::SPECIAL_CHARACTERS_IN_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_bad_parenthesis.person.name),
          RV::ValidationWarning.new(PV::MULTIPLE_NEWCOMERS_WITH_SAME_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_same_name1.person.name),
          RV::ValidationWarning.new(PV::LOWERCASE_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_lowercase1.person.name),
          RV::ValidationWarning.new(PV::LOWERCASE_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_lowercase2.person.name),
          RV::ValidationWarning.new(PV::UPPERCASE_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_bad_period_upcase.person.name),
          RV::ValidationWarning.new(PV::LETTER_AFTER_PERIOD_WARNING,
                                    :persons, competition1.id,
                                    name: res_bad_period_upcase.person.name),
          RV::ValidationWarning.new(PV::MISSING_PERIOD_WARNING,
                                    :persons, competition1.id,
                                    name: res_missing_period.person.name),
          RV::ValidationWarning.new(PV::SINGLE_LETTER_FIRST_OR_LAST_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_single_letter.person.name),
          RV::ValidationWarning.new(PV::SINGLE_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_same_name1.person.name),
          RV::ValidationWarning.new(PV::SINGLE_NAME_WARNING,
                                    :persons, competition1.id,
                                    name: res_same_name2.person.name),
        ]
        validator_args = [
          { competition_ids: [competition1.id, competition2.id], model: InboxResult },
          { results: InboxResult.where(competition_id: [competition1.id, competition2.id]), model: InboxResult },
        ]
        validator_args.each do |arg|
          pv = PV.new.validate(**arg)
          expect(pv.errors).to match_array(expected_errors)
          expect(pv.warnings).to match_array(expected_warnings)
        end
      end

      # Test case for valid international names that should NOT trigger SPECIAL_CHARACTERS_IN_NAME_WARNING
      it "allows valid international names with apostrophes, Unicode scripts, and special characters" do
        round_333oh = create(:round, event_id: "333oh", competition: competition1)

        # Test names with apostrophes (common in many countries)
        res_apostrophe1 = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_apostrophe1.person.update(name: "Adam D'Aloia")

        res_apostrophe2 = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_apostrophe2.person.update(name: "Sebastian O'Mahony-Hagan")

        # Test names with Unicode scripts (Chinese, Thai, Devanagari, Arabic, Russian, Tamil, etc.)
        res_chinese = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_chinese.person.update(name: "Shayibai Halimulati (莎伊拜·哈力木拉提)")

        res_thai = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_thai.person.update(name: "Kanneti Sae Han (คันธ์เนตี แซ่ห่าน)")

        res_devanagari = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_devanagari.person.update(name: "Ram Thakkar (राम ठक्कर)")

        res_arabic = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_arabic.person.update(name: "Farham Farajizadeh (فرهام فرجی‌زاده)")

        res_russian = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_russian.person.update(name: "Nikita Razzamazov (Никита Раззама́зов)")

        res_tamil = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_tamil.person.update(name: "Akash Sreedharan (ஆகாஷ் ஸ்ரீதரன்)")

        res_bengali = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_bengali.person.update(name: "Sourayan Chanda (সৌরায়ন চন্দ)")

        res_kannada = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_kannada.person.update(name: "Smijo P. Abraham (സ്മിജോ പി എബ്രഹാം)")

        res_ukrainian = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_ukrainian.person.update(name: "Oleksii Grygoriev (Олексій Григор'єв)")

        res_baybayin = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_baybayin.person.update(name: "John Edison Ubaldo (ᜇ᜔ᜌᜓ︀ᜈ᜔ ᜁᜇᜒᜐᜓ︀ᜈ᜔ ᜂᜊᜎ᜔ᜇᜓ︀)")

        res_vietnamese = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_vietnamese.person.update(name: "Trần Tử Kiên")

        # Test names with forward slash (names in Malaysia especially among Malaysians of Indian origin)
        # A/L = “Anak Lelaki” (Malay) → means “son of”
        # A/P = “Anak Perempuan” → means “daughter of”
        res_slash = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_slash.person.update(name: "Sanjev A/L Loganathan")

        # Test names with middle dot
        res_middledot = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_middledot.person.update(name: "Shayibai Halimulati (莎伊拜·哈力木拉提)")

        # Test names with bullet
        res_bullet = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_bullet.person.update(name: "Arabel•la Puig Villacorta")

        # Test name with Dutch "in 't"
        res_dutch = create(:inbox_result, competition: competition1, event_id: "333oh", round: round_333oh)
        res_dutch.person.update(name: "Jelle in 't Veld")

        validator_args = [
          { competition_ids: [competition1.id], model: InboxResult },
          { results: InboxResult.where(competition_id: competition1.id), model: InboxResult },
        ]

        validator_args.each do |arg|
          pv = PV.new.validate(**arg)
          # None of these names should trigger SPECIAL_CHARACTERS_IN_NAME_WARNING
          expect(pv.warnings).to be_empty
          expect(pv.errors).to be_empty
        end
      end
    end
  end
end
