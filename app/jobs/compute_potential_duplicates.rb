# frozen_string_literal: true

class ComputePotentialDuplicates < ApplicationJob
  def perform(job)
    persons_cache = Person.select(:id, :wca_id, :name, :dob, :country_id)

    job.touch(:start_time)
    job.update!(run_status: DuplicateCheckerJobRun.run_statuses[:in_progress])

    job.competition.accepted_newcomers.each do |user|
      similar_persons = FinishUnfinishedPersons.compute_similar_persons(user.name, user.country.id, persons_cache)

      similar_persons.each do |person, score_decimal|
        PotentialDuplicatePerson.create!(
          duplicate_checker_job_run_id: job.id,
          original_user_id: user.id,
          duplicate_person_id: person.id,
          name_matching_algorithm: PotentialDuplicatePerson.name_matching_algorithms[:jarowinkler],
          score: score_decimal * 100,
        )
      end
    end

    job.touch(:end_time)
    job.update!(run_status: DuplicateCheckerJobRun.run_statuses[:success])
  end
end
