# frozen_string_literal: true

class ComputePotentialDuplicates < ApplicationJob
  def perform(job)
    persons_cache = Person.select(:id, :wca_id, :name, :dob, :country_id)
    new_comers = job.competition
                    .registrations
                    .includes(:user)
                    .select { it.wcif_status == "accepted" }
                    .map(&:user)
                    .select { it.wca_id.nil? }

    job.touch(:start_time)
    job.update!(status: DuplicateCheckerJob.statuses[:in_progress])
    new_comers.each do |user|
      name = user.name
      country_id = user.country.id
      similar_persons = FinishUnfinishedPersons.compute_similar_persons(name, country_id, persons_cache)
      similar_persons.each do |person, score_decimal|
        PotentialDuplicatePerson.create!(
          duplicate_checker_job_id: job.id,
          original_user_id: user.id,
          duplicate_person_id: person.id,
          algorithm: PotentialDuplicatePerson.algorithms[:jarowinkler],
          score: score_decimal * 100,
        )
      end
    end
    job.touch(:end_time)
    job.update!(status: DuplicateCheckerJob.statuses[:success])
  end
end
