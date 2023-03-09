# frozen_string_literal: true

require 'fuzzystringmatch'

module FinishUnfinishedPersons
  WCA_ID_PADDING = 'U'
  WCA_QUARTER_ID_LENGTH = 4

  WITH_ACCENT = 'ÀÁÂÃÄÅÆĂÇĆČÈÉÊËÌÍÎÏİÐĐÑÒÓÔÕÖØÙÚÛÜÝÞřßŞȘŠŚşșśšŢȚţțŻŽźżžəàáâãäåæăąắặảầấạậāằçćčèéêëęěễệếềēểğìíîïịĩіıðđķКкŁłļñńņňòóôõöøỗọơốờőợồộớùúûüưứữũụűūůựýýþÿỳỹ'
  WITHOUT_ACCENT = 'aaaaaaaaccceeeeiiiiiddnoooooouuuuybrsssssssssttttzzzzzaaaaaaaaaaaaaaaaaaaccceeeeeeeeeeeegiiiiiiiiddkKklllnnnnoooooooooooooooouuuuuuuuuuuuuyybyyy'

  def self.search_persons(competition_id = nil)
    results_scope = Result.includes(:competition, :inbox_person)
                          .select(:personId, :personName, :competitionId, :countryId)

    results_scope = results_scope.where(competitionId: competition_id) if competition_id.present?

    unfinished_person_results = results_scope.where("(personId = '' OR personId REGEXP '^[0-9]+$')")
                                             .group(:personId, :personName, :competitionId, :countryId)
                                             .order(:personName)

    unfinished_persons = []
    available_id_spots = {} # to make sure that all of the newcomer IDs that we're creating in one batch are unique among each other

    unfinished_person_results.each do |res|
      competition_year = res.competition.year
      inbox_dob = res.inbox_person&.dob

      roman_name = self.extract_roman_name res.person_name
      sanitized_roman_name = self.remove_accents roman_name
      name_parts = sanitized_roman_name.gsub(/[^a-zA-Z ]/, '').upcase.split

      last_name = name_parts[-1]
      rest_of_name = name_parts[...-1].join

      padded_rest_of_name = rest_of_name.ljust WCA_QUARTER_ID_LENGTH, WCA_ID_PADDING
      letters_to_shift = [0, WCA_QUARTER_ID_LENGTH - last_name.length].max

      semi_id = nil
      cleared_id = false

      until cleared_id || letters_to_shift > WCA_QUARTER_ID_LENGTH
        quarter_id = last_name[...(WCA_QUARTER_ID_LENGTH - letters_to_shift)] + padded_rest_of_name[...letters_to_shift]
        semi_id = competition_year.to_s + quarter_id

        unless available_id_spots.key?(semi_id)
          # TODO: Merge with anonymization code
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
                                person_id: res.person_id,
                                person_name: res.person_name,
                                country_id: res.country_id,
                                competition_id: res.competition_id,
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

  def self.compute_similar_persons(result, n = 5)
    res_roman_name = self.extract_roman_name(result.person_name)

    only_probas = []
    persons_with_probas = []

    # pre-cache probabilities, so that we avoid doing string computations on _every_ comparison
    Person.all.each do |p|
      p_roman_name = self.extract_roman_name(p.name)

      name_similarity = self.string_similarity(res_roman_name, p_roman_name)
      country_similarity = result.country_id == p.countryId ? 1 : 0

      only_probas.push name_similarity
      persons_with_probas.push [p, name_similarity, country_similarity]
    end

    proba_threshold = only_probas.sort { |a, b| b <=> a }.take(2 * n).last
    sorting_candidates = persons_with_probas.filter { |_, np, _| np >= proba_threshold }

    # `sort_by` is _sinfully_ expensive, so we try to reduce the amount of comparisons as much as possible.
    sorting_candidates.sort_by { |p, np, cp| [-np, -cp, p.wca_id.present?] }
                      .take(n)
  end

  def self.string_similarity(a, b)
    # Original PHP implementation uses PHP stdlib `string_similarity` function, which is custom built
    # and "kinda like" Jaro-Winkler. I felt that the rewrite warrants a standardised matching algorithm.
    @jarow ||= FuzzyStringMatch::JaroWinkler.create(:native)

    @jarow.getDistance(a, b)
  end

  def self.complete_wca_id(semi_id, used_ids)
    (1..99).each do |i|
      new_id = semi_id + i.to_s.rjust(2, '0')

      unless used_ids.include? new_id
        used_ids.push new_id
        return [new_id, used_ids]
      end
    end

    raise "Uh oh! Not able to compute a free WCA ID for #{semi_id}"
  end

  def self.insert_person(inbox_person, new_name, new_country, new_wca_id)
    Person.create(
      wca_id: new_wca_id,
      subId: 1,
      name: new_name,
      countryId: new_country,
      gender: inbox_person.gender,
      year: inbox_person.dob.year,
      month: inbox_person.dob.month,
      day: inbox_person.dob.day,
      comments: '',
    )
  end

  def self.adapt_results(pending_id, pending_name, pending_country, new_name, new_country, new_wca_id, pending_comp_id = nil)
    results_scope = Result

    if pending_id.present?
      raise "Must supply a competition ID for updating newcomer results!" if pending_comp_id.nil?

      results_scope = results_scope.where(personId: pending_id)
                                   .where(competition_id: pending_comp_id)
    else
      results_scope = results_scope.where(personName: pending_name)
                                   .where(countryId: pending_country)
                                   .where(personId: '') # personId is empty when splitting profiles
    end

    results_scope.update_all(personName: new_name, countryId: new_country, personId: new_wca_id)
  end
end
