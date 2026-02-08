# frozen_string_literal: true

class ComputePotentialDuplicates < ApplicationJob
  def perform(job)
    persons_cache = Person.select(:id, :wca_id, :name, :dob, :country_id)

    job.touch(:start_time)
    job.update!(run_status: DuplicateCheckerJobRun.run_statuses[:in_progress])

    job.competition.accepted_newcomers.each do |user|
      PotentialDuplicatePerson.name_matching_algorithms.each_key do |algorithm|
        duplicates = find_duplicates(algorithm, user, persons_cache)

        duplicates.each do |person_id, score|
          PotentialDuplicatePerson.create!(
            duplicate_checker_job_run_id: job.id,
            original_user_id: user.id,
            duplicate_person_id: person_id,
            name_matching_algorithm: PotentialDuplicatePerson.name_matching_algorithms[algorithm],
            score: score,
          )
        end
      end
    end

    job.touch(:end_time)
    job.update!(run_status: DuplicateCheckerJobRun.run_statuses[:success])
  end

  private

    def find_duplicates(algorithm, user, persons_cache)
      case algorithm.to_sym
      when :jarowinkler
        similar_persons = FinishUnfinishedPersons.compute_similar_persons(user.name, user.country.id, persons_cache)
        similar_persons.to_h { |person, name_similarity, _country_similarity| [person.id, name_similarity * 100] }
      when :exact_first_last_dob
        find_exact_first_last_dob_matches(user, persons_cache)
      else
        raise ArgumentError.new("Unknown algorithm: #{algorithm}")
      end
    end

    def find_exact_first_last_dob_matches(user, persons_cache)
      return {} if user.dob.blank?

      user_first_name, user_last_name = extract_first_last_name(user.name)
      return {} if user_first_name.blank? || user_last_name.blank?

      matches = {}

      persons_cache.each do |person|
        next if person.dob.blank? || person.dob != user.dob

        person_first_name, person_last_name = extract_first_last_name(person.name)
        next if person_first_name.blank? || person_last_name.blank?

        matches[person.id] = 100 if user_first_name.casecmp?(person_first_name) && user_last_name.casecmp?(person_last_name)
      end

      matches
    end

    def extract_first_last_name(full_name)
      roman_name = FinishUnfinishedPersons.extract_roman_name(full_name)
      sanitized_name = FinishUnfinishedPersons.remove_accents(roman_name)
      name_parts = sanitized_name.gsub(/[^a-zA-Z ]/, '').split

      return [nil, nil] if name_parts.length < 2

      last_name_index = FinishUnfinishedPersons::GENERATIONAL_SUFFIXES.include?(name_parts[-1].upcase) ? -2 : -1
      return [nil, nil] if last_name_index == -2 && name_parts.length < 3

      last_name = name_parts[last_name_index]
      first_name = name_parts.first

      [first_name, last_name]
    end
end
