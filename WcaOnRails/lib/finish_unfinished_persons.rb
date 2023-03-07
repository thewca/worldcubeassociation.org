# frozen_string_literal: true

module FinishUnfinishedPersons
  WCA_ID_PADDING = 'U'
  WCA_QUARTER_ID_LENGTH = 4

  WITH_ACCENT =    'ÀÁÂÃÄÅÆĂÇĆČÈÉÊËÌÍÎÏİÐĐÑÒÓÔÕÖØÙÚÛÜÝÞřßŞȘŠŚşșśšŢȚţțŻŽźżžəàáâãäåæăąắặảầấạậāằçćčèéêëęěễệếềēểğìíîïịĩіıðđķКкŁłļñńņňòóôõöøỗọơốờőợồộớùúûüưứữũụűūůựýýþÿỳỹ'
  WITHOUT_ACCENT = 'aaaaaaaaccceeeeiiiiiddnoooooouuuuybrsssssssssttttzzzzzaaaaaaaaaaaaaaaaaaaccceeeeeeeeeeeegiiiiiiiiddkKklllnnnnoooooooooooooooouuuuuuuuuuuuuyybyyy'

  def self.search_persons(competition_id = nil)
    results_scope = Result.includes(:competition, :inbox_person)

    results_scope = results_scope.where(competitionId: competition_id) if competition_id.present?

    # TODO: klammert ActiveRecord mir das richtig?
    unfinished_person_results = results_scope.where(personId: '')
                                             .or("personId REGEXP '^[0-9]+$'")
                                             .group(:personId, :personName, :competitionId, :countryId)

    unfinished_persons = []
    available_id_spots = {} # to make sure that all of the newcomer IDs that we're creating in one batch are unique among each other

    unfinished_person_results.find_each do |res|
      competition_year = res.competition.year
      inbox_dob = res.inbox_person&.dob

      roman_name = self.extract_roman_name res.person_name
      sanitized_roman_name = self.remove_accents roman_name
      name_parts = sanitized_roman_name.gsub(/[^a-zA-Z ]/, '').split

      last_name = name_parts[-1]
      rest_of_name = name_parts[0..-2]

      padded_rest_of_name = rest_of_name.join.ljust WCA_QUARTER_ID_LENGTH, WCA_ID_PADDING
      letters_to_shift = [0, WCA_QUARTER_ID_LENGTH - padded_rest_of_name.length].max

      semi_id = nil
      cleared_id = false

      until cleared_id || letters_to_shift > WCA_QUARTER_ID_LENGTH
        quarter_id = last_name[..(WCA_QUARTER_ID_LENGTH - letters_to_shift)] + padded_rest_of_name[..letters_to_shift]
        semi_id = competition_year.to_s + quarter_id

        unless available_id_spots.key?(semi_id)
          # TODO: Mit Jacobs anon feature abgleichen
          last_id_taken = Person.where('wca_id LIKE ?', "#{semi_id}__")
                                .order(wca_id: :desc)
                                .pluck(:wca_id)
                                .first

          if last_id_taken.present?
            counter = last_id_taken[(4 + WCA_QUARTER_ID_LENGTH)..].to_i
          else
            counter = 0
          end

          available_id_spots[semi_id] = 99 - counter
        end

        if available_id_spots.key?(semi_id)
          available_id_spots[semi_id] -= 1
          cleared_id = true
        else
          letters_to_shift += 1
        end
      end

      unless cleared_id
        raise "Could not compute a semi-id for #{res.person_name}"
      end

      similar_persons = compute_similar_persons(res)

      unfinished_persons.push({
                                person_name: res.person_name,
                                country_id: res.country_id,
                                person_dob: inbox_dob,
                                computed_semi_id: semi_id,
                                similar_persons: similar_persons,
                              })
    end

    unfinished_persons
  end

  def self.extract_roman_name(person_name)
    name_matches = person_name.match(/(.*)\((.*)\)$/)
    name_matches ? name_matches[0] : person_name
  end

  def self.remove_accents(name)
    name.chars.map do |c|
      strpos = WITH_ACCENT.index c
      strpos.present? ? WITHOUT_ACCENT[strpos] : c
    end.join
  end

  def self.compute_similar_persons(result)
    Person.all
          .sort_by do |p|
      name_similarity = self.string_similarity(result.person_name, p.name)
      country_similarity = self.string_similarity(result.person_name, p.name)

      [name_similarity, country_similarity, p.wca_id.present?]
    end
  end

  def self.string_similarity(a, b)
    0 # TODO: Tentative implementation
  end
end
