# frozen_string_literal: true

class ComputePotentialDuplicates < ApplicationJob
  def perform(competition)
    persons_cache = Person.select(:id, :wca_id, :name, :dob, :country_id)
    new_comers = competition.registrations
                            .includes(:user)
                            .select { it.wcif_status == "accepted" }
                            .map(&:user)
                            .select { it.wca_id.nil? }

    competition.potential_duplicate_people.delete_all

    new_comers.each do |user|
      name = user.name
      country_id = user.country.id
      similar_persons = FinishUnfinishedPersons.compute_similar_persons(name, country_id, persons_cache)
      similar_persons.each do |person, score_decimal|
        PotentialDuplicatePerson.create!(
          competition_id: competition.id,
          original_user_id: user.id,
          duplicate_person_id: person.id,
          algorithm: PotentialDuplicatePerson.algorithms[:jarowinkler],
          score: score_decimal * 100,
        )
      end
    end

    competition.update!(
      duplicate_checker_last_fetch_status: :fetch_successful,
      duplicate_checker_last_fetch_time: Time.current,
    )
  end
end
