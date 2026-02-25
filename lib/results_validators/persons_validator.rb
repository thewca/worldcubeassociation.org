# frozen_string_literal: true

module ResultsValidators
  class PersonsValidator < GenericValidator
    PERSON_WITHOUT_RESULTS_ERROR = :person_doesnt_have_any_results_error
    RESULTS_WITHOUT_PERSON_ERROR = :results_not_associated_with_any_person_error
    WHITESPACE_IN_NAME_ERROR = :whitespace_in_name_error
    WRONG_WCA_ID_ERROR = :person_with_non_existing_wca_id_error
    WRONG_PARENTHESIS_FORMAT_ERROR = :no_space_before_parenthesis_error
    DOB_0101_WARNING = :dob_is_jan_one_warning
    VERY_YOUNG_PERSON_WARNING = :dob_is_too_young_warning
    NOT_SO_YOUNG_PERSON_WARNING = :dob_is_too_old_warning
    SAME_PERSON_NAME_WARNING = :same_person_name_warning
    NON_MATCHING_DOB_WARNING = :non_matching_dob_warning
    NON_MATCHING_GENDER_WARNING = :non_matching_gender_warning
    EMPTY_GENDER_WARNING = :empty_gender_warning
    NON_MATCHING_NAME_WARNING = :non_matching_name_warning
    NON_MATCHING_COUNTRY_WARNING = :non_matching_country_warning
    MULTIPLE_NEWCOMERS_WITH_SAME_NAME_WARNING = :multiple_newcomers_with_same_name_warning
    WRONG_PARENTHESIS_TYPE_ERROR = :wrong_parenthesis_type_error
    UPPERCASE_NAME_WARNING = :successive_uppercase_name_warning
    LOWERCASE_NAME_WARNING = :lowercase_name_warning
    MISSING_PERIOD_WARNING = :missing_period_in_single_letter_middle_name_warning
    LETTER_AFTER_PERIOD_WARNING = :letter_after_period_warning
    SINGLE_LETTER_FIRST_OR_LAST_NAME_WARNING = :single_letter_first_or_last_name_warning
    SINGLE_NAME_WARNING = :single_name_warning
    SPECIAL_CHARACTERS_IN_NAME_WARNING = :special_characters_in_name_warning

    def self.description
      "This validator checks that Persons data make sense with regard to the competition results and the WCA database."
    end

    def self.automatically_fixable?
      false
    end

    def include_persons?
      true
    end

    def self.roman_readable_part(name)
      if name.include? " ("
        name[0, name.index('(') - 1]
      else
        name
      end
    end

    def self.dob_validations(dob, competition_id = nil, **message_args)
      validation_issues = []

      # Check if DOB is January 1
      validation_issues << ValidationWarning.new(DOB_0101_WARNING, :persons, competition_id, **message_args) if dob.month == 1 && dob.day == 1

      # Check if DOB is very young, competitor less than 3 years old are extremely rare, so we'd better check these birthdate are correct.
      validation_issues << ValidationWarning.new(VERY_YOUNG_PERSON_WARNING, :persons, competition_id, **message_args) if dob.year >= Time.now.year - 3

      # Check if DOB is not so young
      validation_issues << ValidationWarning.new(NOT_SO_YOUNG_PERSON_WARNING, :persons, competition_id, **message_args) if dob.year <= Time.now.year - 100

      validation_issues
    end

    def self.name_validations(name, competition_id = nil, **_message_args)
      validation_issues = []
      roman_readable = PersonsValidator.roman_readable_part(name)
      split_name = roman_readable.split

      # Check for double whitespaces or leading/trailing whitespaces.
      validation_issues << ValidationError.new(WHITESPACE_IN_NAME_ERROR, :persons, competition_id, name: name) unless name.squeeze(" ").strip == name

      # Check for opening parenthesis without space before it.
      validation_issues << ValidationError.new(WRONG_PARENTHESIS_FORMAT_ERROR, :persons, competition_id, name: name) if /[[:alnum:]]\(/.match?(name)

      # Check for wrong parenthesis type.
      validation_issues << ValidationError.new(WRONG_PARENTHESIS_TYPE_ERROR, :persons, competition_id, name: name) if /[（）]/.match?(name)

      ## Check for special characters in name.
      # # Regex %r{[^\p{L}\p{M}\p{Zs}\-'.’()·•/]} uses a negated character class —
      # # it matches any character NOT in the allowed set.
      # # \p{L}  - Any Unicode letter (Latin, Cyrillic, Arabic, Chinese, Tamil, etc.)
      # # \p{M}  - Unicode combining marks (accents/diacritics used in names)
      # # \p{Zs} - Unicode space separators (standard and non-breaking spaces)
      # # \-     - Hyphen
      # # ' ’    - Straight and curly apostrophes
      # # .      - Period
      # # ()     - Parentheses
      # # ·      - Middle dot (e.g., Chinese/Catalan names)
      # # •      - Bullet character
      # # /      - Forward slash (e.g., A/L naming format)
      # # Triggers warning for digits, @, #, quotes, emojis, and any other symbols
      validation_issues << ValidationWarning.new(SPECIAL_CHARACTERS_IN_NAME_WARNING, :persons, competition_id, name: name) if %r{[^\p{L}\p{M}\p{Zs}\-'.’()·•/]}.match?(name)

      # Check for lowercase name.
      validation_issues << ValidationWarning.new(LOWERCASE_NAME_WARNING, :persons, competition_id, name: name) if split_name.first.downcase == split_name.first || split_name.last.downcase == split_name.last

      # Check for successive uppercase letters in the name.
      validation_issues << ValidationWarning.new(UPPERCASE_NAME_WARNING, :persons, competition_id, name: name) if split_name.any? { |n| n =~ /[[:upper:]]{2}/ && n.length > 2 && n != 'III' } # Roman numerals are allowed as suffixes

      # Check if the name is a single name.
      validation_issues << ValidationWarning.new(SINGLE_NAME_WARNING, :persons, competition_id, name: name) if split_name.length == 1

      # Check for missing period in single letter middle name.
      validation_issues << ValidationWarning.new(MISSING_PERIOD_WARNING, :persons, competition_id, name: name) if split_name.length > 2 && split_name[1, split_name.length - 2].any? { |n| n.length == 1 }

      # Check for letter after period.
      validation_issues << ValidationWarning.new(LETTER_AFTER_PERIOD_WARNING, :persons, competition_id, name: name) if split_name.any? { |n| n.chop.include? '.' }

      # Check for single letter first or last name.
      non_word_after_first_letter = [' ', '.'].include?(roman_readable[1])
      space_before_last_letter = (roman_readable[-2] == " ") && %w[I V].exclude?(roman_readable[-1]) # Roman numerals are allowed as suffixes
      abbreviated_last_name = (roman_readable[-1] == ".") && (roman_readable[-3] == " ")
      validation_issues << ValidationWarning.new(SINGLE_LETTER_FIRST_OR_LAST_NAME_WARNING, :persons, competition_id, name: name) if non_word_after_first_letter || space_before_last_letter || abbreviated_last_name

      validation_issues
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition
        results_for_comp = competition_data.results

        persons_by_id = competition_data.persons.index_by(&:ref_id)

        detected_person_ids = persons_by_id.keys
        persons_with_results = results_for_comp.map(&:person_id)
        (detected_person_ids - persons_with_results).each do |person_id|
          @errors << ValidationError.new(PERSON_WITHOUT_RESULTS_ERROR,
                                         :persons, competition.id,
                                         person_id: person_id,
                                         person_name: persons_by_id[person_id].name)
        end
        (persons_with_results - detected_person_ids).each do |person_id|
          @errors << ValidationError.new(RESULTS_WITHOUT_PERSON_ERROR,
                                         :persons, competition.id,
                                         person_id: person_id)
        end

        without_wca_id, with_wca_id = persons_by_id.values.partition { |p| p.wca_id.empty? }
        if without_wca_id.any?
          existing_person_in_db_by_name = Person.where(name: without_wca_id.map(&:name)).group_by(&:name)
          existing_person_in_db_by_name.each do |name, persons|
            @warnings << ValidationWarning.new(SAME_PERSON_NAME_WARNING,
                                               :persons, competition.id,
                                               name: name,
                                               wca_ids: persons.map(&:wca_id).join(", "))
          end
        end
        duplicate_newcomer_names = []
        without_wca_id.each do |p|
          if p.gender.blank?
            @warnings << ValidationWarning.new(EMPTY_GENDER_WARNING,
                                               :persons, competition.id,
                                               name: p.name)
          end

          [
            PersonsValidator.name_validations(p.name, competition.id),
            PersonsValidator.dob_validations(p.dob, competition.id, name: p.name),
          ].flatten.each do |validation|
            if validation.is_a?(ValidationError)
              @errors << validation
            elsif validation.is_a?(ValidationWarning)
              @warnings << validation
            end
          end
          # Look for if 2 new competitors that share the exact same name
          duplicate_newcomer_names << p.name if without_wca_id.many? { |p2| p2.name == p.name } && duplicate_newcomer_names.exclude?(p.name)
        end
        duplicate_newcomer_names.each do |name|
          @warnings << ValidationWarning.new(MULTIPLE_NEWCOMERS_WITH_SAME_NAME_WARNING,
                                             :persons, competition.id,
                                             name: name)
        end
        with_wca_id.each do |p|
          # We have to "convert" to the actual `Person` model first, which is reasonable given that we're only using entries that have a WCA ID.
          existing_person = p.wca_person

          if existing_person.present?
            # WRT wants to show warnings for wrong person information.
            # (If I get this right, we do not actually update existing persons from InboxPerson)
            unless p.dob == existing_person.dob
              @warnings << ValidationWarning.new(NON_MATCHING_DOB_WARNING,
                                                 :persons, competition.id,
                                                 name: p.name, wca_id: p.wca_id,
                                                 expected_dob: existing_person.dob,
                                                 dob: p.dob)
            end
            unless p.gender == existing_person.gender
              @warnings << ValidationWarning.new(NON_MATCHING_GENDER_WARNING,
                                                 :persons, competition.id,
                                                 name: p.name, wca_id: p.wca_id,
                                                 expected_gender: existing_person.gender,
                                                 gender: p.gender)
            end
            unless p.name == existing_person.name
              @warnings << ValidationWarning.new(NON_MATCHING_NAME_WARNING,
                                                 :persons, competition.id,
                                                 name: p.name, wca_id: p.wca_id,
                                                 expected_name: existing_person.name)
            end
            unless p.country.id == existing_person.country.id
              @warnings << ValidationWarning.new(NON_MATCHING_COUNTRY_WARNING,
                                                 :persons, competition.id,
                                                 name: p.name, wca_id: p.wca_id,
                                                 expected_country: existing_person.country_iso2,
                                                 country: p.country_iso2)
            end
          else
            @errors << ValidationError.new(WRONG_WCA_ID_ERROR,
                                           :persons, competition.id,
                                           name: p.name, wca_id: p.wca_id)
          end
        end
      end
    end
  end
end
