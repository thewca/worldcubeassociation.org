# frozen_string_literal: true

module ResultsValidators
  class PersonsValidator < GenericValidator
    PERSON_WITHOUT_RESULTS_ERROR = "There are no results for %{person_name} with person id %{person_id}"
    RESULTS_WITHOUT_PERSON_ERROR = "There are results for an unknown person with person id %{person_id}"
    WHITESPACE_IN_NAME_ERROR = "Person '%{name}' has leading/trailing whitespaces or double whitespaces."
    WRONG_WCA_ID_ERROR = "Person %{name} has a WCA ID which does not exist: %{wca_id}."
    WRONG_PARENTHESIS_FORMAT_ERROR = "Opening parenthesis in '%{name}' must be preceded by a space."
    DOB_0101_WARNING = "The date of birth of %{name} is on January 1st, please ensure it's correct."
    VERY_YOUNG_PERSON_WARNING = "%{name} seems to be less than 3 years old, please ensure it's correct."
    NOT_SO_YOUNG_PERSON_WARNING = "%{name} seems to be around 100 years old, please ensure it's correct."
    SAME_PERSON_NAME_WARNING = "There is already at least one person with the name '%{name}' in the WCA database (%{wca_ids}). " \
                               "Please ensure that your '%{name}' is a different person. If not, please assign the correct WCA ID to the user account and regenerate the results JSON."
    NON_MATCHING_DOB_WARNING = "The birthdate '%{dob}' provided for %{name} (%{wca_id}) does not match the current record in the WCA database ('%{expected_dob}'). If this is an error, fix it. Otherwise, leave a comment to the WRT about it."
    NON_MATCHING_GENDER_WARNING = "The gender '%{gender}' provided for %{name} (%{wca_id}) does not match the current record in the WCA database ('%{expected_gender}'). " \
                                  "If this is an error, fix it. Otherwise, leave a comment to the WRT about it."
    EMPTY_GENDER_WARNING = "The gender for newcomer %{name} is empty. Valid gender values are 'female', 'male' and 'other'. Please leave a comment to the WRT about this."
    NON_MATCHING_NAME_WARNING = "The name '%{name}' provided for %{wca_id} does not match the current record in the WCA database ('%{expected_name}'). "
    NON_MATCHING_COUNTRY_WARNING = "The country '%{country}' provided for %{name} (%{wca_id}) does not match the current record in the WCA database ('%{expected_country}'). " \
                                   "If this is an error, fix it. Otherwise, leave a comment to the WRT about it."
    MULTIPLE_NEWCOMERS_WITH_SAME_NAME_WARNING = "There are multiple new competitors with the exact same name: %{name}. Please ensure that all results are correct for these competitors " \
                                                "and that all results are correctly seperated by their corresponding id."
    WRONG_PARENTHESIS_TYPE_ERROR = "The parenthesis character used in '%{name}' is an irregular character, please replace it with a regular parenthesis '(' or ')' and with appropriate spacing."
    LOWERCASE_NAME_WARNING = "'%{name}' has a lowercase name, please ensure the correct spelling."
    MISSING_ABBREVIATION_PERIOD_WARNING = "'%{name}' is missing an abbreviation period from a single letter middle name, please ensure the correct spelling."
    SINGLE_LETTER_FIRST_OR_LAST_NAME_WARNING = "'%{name}' has a single letter as first or last name, please fix the name."

    @@desc = "This validator checks that Persons data make sense with regard to the competition results and the WCA database."

    def self.has_automated_fix?
      false
    end

    def validate(competition_ids: [], model: Result, results: nil)
      reset_state
      # Get all results if not provided
      results ||= model.sorted_for_competitions(competition_ids)
      results_by_competition_id = results.group_by(&:competitionId)

      competitions = Competition.where(id: results_by_competition_id.keys).to_h do |c|
        [c.id, c]
      end
      results_by_competition_id.each do |competition_id, results_for_comp|
        persons_by_id = if model == Result
                          competitions[competition_id].competitors.map { |p| [p.wca_id, p] }
                        else
                          InboxPerson.where(competitionId: competition_id).map { |p| [p.id, p] }
                        end.to_h
        detected_person_ids = persons_by_id.keys
        persons_with_results = results_for_comp.map(&:personId)
        (detected_person_ids - persons_with_results).each do |person_id|
          @errors << ValidationError.new(:persons, competition_id,
                                         PERSON_WITHOUT_RESULTS_ERROR,
                                         person_id: person_id,
                                         person_name: persons_by_id[person_id].name)
        end
        (persons_with_results - detected_person_ids).each do |person_id|
          @errors << ValidationError.new(:persons, competition_id,
                                         RESULTS_WITHOUT_PERSON_ERROR,
                                         person_id: person_id)
        end

        without_wca_id, with_wca_id = persons_by_id.values.partition { |p| p.wca_id.empty? }
        if without_wca_id.any?
          existing_person_in_db_by_name = Person.where(name: without_wca_id.map(&:name)).group_by(&:name)
          existing_person_in_db_by_name.each do |name, persons|
            @warnings << ValidationWarning.new(:persons, competition_id,
                                               SAME_PERSON_NAME_WARNING,
                                               name: name,
                                               wca_ids: persons.map(&:wca_id).join(", "))
          end
        end
        duplicate_newcomer_names = []
        without_wca_id.each do |p|
          if p.dob.month == 1 && p.dob.day == 1
            @warnings << ValidationWarning.new(:persons, competition_id,
                                               DOB_0101_WARNING,
                                               name: p.name)
          end
          if p.gender.blank?
            @warnings << ValidationWarning.new(:persons, competition_id,
                                               EMPTY_GENDER_WARNING,
                                               name: p.name)
          end
          # Competitor less than 3 years old are extremely rare, so we'd better check these birthdate are correct.
          if p.dob.year >= Time.now.year - 3
            @warnings << ValidationWarning.new(:persons, competition_id,
                                               VERY_YOUNG_PERSON_WARNING,
                                               name: p.name)
          end
          if p.dob.year <= Time.now.year - 100
            @warnings << ValidationWarning.new(:persons, competition_id,
                                               NOT_SO_YOUNG_PERSON_WARNING,
                                               name: p.name)
          end
          # Look for double whitespaces or leading/trailing whitespaces.
          unless p.name.squeeze(" ").strip == p.name
            @errors << ValidationError.new(:persons, competition_id,
                                           WHITESPACE_IN_NAME_ERROR,
                                           name: p.name)
          end
          if /[[:alnum:]]\(/ =~ p.name
            @errors << ValidationError.new(:persons, competition_id,
                                           WRONG_PARENTHESIS_FORMAT_ERROR,
                                           name: p.name)
          end
          if /[（）]/ =~ p.name
            @errors << ValidationError.new(:persons, competition_id,
                                           WRONG_PARENTHESIS_TYPE_ERROR,
                                           name: p.name)
          end
          # Look for if 2 new competitors that share the exact same name
          if without_wca_id.select { |p2| p2.name == p.name }.length > 1 && !duplicate_newcomer_names.include?(p.name)
            duplicate_newcomer_names << p.name
          end
          # Look for obvious person name issues (in roman-readable part)
          if p.name.include? " ("
            roman_readable = p.name[0, p.name.index('(')-1]
          else
            roman_readable = p.name
          end
          split_name = roman_readable.split
          if split_name.any? { |n| n.downcase == n }
            @warnings << ValidationWarning.new(:persons, competition_id,
                                               LOWERCASE_NAME_WARNING,
                                               name: p.name)
          end
          if split_name.length > 2
            if split_name[1, split_name.length-2].any? { |n| n.length == 1 }
              @warnings << ValidationWarning.new(:persons, competition_id,
                                                 MISSING_ABBREVIATION_PERIOD_WARNING,
                                                 name: p.name)
            end
          end
          non_word_after_first_letter = [' ', '.'].include?(roman_readable[1])
          space_before_last_letter = (roman_readable[-2] == " ") && !['I', 'V'].include?(roman_readable[-1]) # Roman numerals I and V are allowed as suffixes
          abbreviated_last_name = (roman_readable[-1] == ".") && (roman_readable[-3] == " ")
          if non_word_after_first_letter || space_before_last_letter || abbreviated_last_name
            @warnings << ValidationWarning.new(:persons, competition_id,
                                               SINGLE_LETTER_FIRST_OR_LAST_NAME_WARNING,
                                               name: p.name)
          end
        end
        duplicate_newcomer_names.each do |name|
          @warnings << ValidationWarning.new(:persons, competition_id,
                                             MULTIPLE_NEWCOMERS_WITH_SAME_NAME_WARNING,
                                             name: name)
        end
        existing_person_by_wca_id = Person.current.where(wca_id: with_wca_id.map(&:wca_id)).to_h { |p| [p.wca_id, p] }
        with_wca_id.each do |p|
          existing_person = existing_person_by_wca_id[p.wca_id]
          if existing_person
            # WRT wants to show warnings for wrong person information.
            # (If I get this right, we do not actually update existing persons from InboxPerson)
            unless p.dob == existing_person.dob
              @warnings << ValidationWarning.new(:persons, competition_id,
                                                 NON_MATCHING_DOB_WARNING,
                                                 name: p.name, wca_id: p.wca_id,
                                                 expected_dob: existing_person.dob,
                                                 dob: p.dob)
            end
            unless p.gender == existing_person.gender
              @warnings << ValidationWarning.new(:persons, competition_id,
                                                 NON_MATCHING_GENDER_WARNING,
                                                 name: p.name, wca_id: p.wca_id,
                                                 expected_gender: existing_person.gender,
                                                 gender: p.gender)
            end
            unless p.name == existing_person.name
              @warnings << ValidationWarning.new(:persons, competition_id,
                                                 NON_MATCHING_NAME_WARNING,
                                                 name: p.name, wca_id: p.wca_id,
                                                 expected_name: existing_person.name)
            end
            unless p.country.id == existing_person.country.id
              @warnings << ValidationWarning.new(:persons, competition_id,
                                                 NON_MATCHING_COUNTRY_WARNING,
                                                 name: p.name, wca_id: p.wca_id,
                                                 expected_country: existing_person.country_iso2,
                                                 country: p.countryId)
            end
          else
            @errors << ValidationError.new(:persons, competition_id,
                                           WRONG_WCA_ID_ERROR,
                                           name: p.name, wca_id: p.wca_id)
          end
        end
      end
      self
    end
  end
end
