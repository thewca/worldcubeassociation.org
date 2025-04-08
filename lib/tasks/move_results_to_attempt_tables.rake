# frozen_string_literal: true

namespace :results do
  desc "Migrates all results to attempts"
  task migrate_attempts: [:environment] do
    Result.find_each do |result|
      # This will trigger the after_commit hook, which upserts the values into the table
      result.touch
    end
  end

  desc "Migrates results from one competition to attempts"
  task :migrate_competition_results, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    abort "Competition id is required" if competition_id.blank?

    competition = Competition.find(competition_id)

    abort "Competition #{competition_id} not found" if competition.nil?

    competition.results.find_each do |result|
      # This will trigger the after_commit hook, which upserts the values into the table
      result.touch
    end
  end

  desc "Migrates results from one person to attempts"
  task :migrate_person_results, [:wca_id] => [:environment] do |_, args|
    wca_id = args[:wca_id]

    abort "WCA id is required" if wca_id.blank?

    person = Person.find_by(wca_id: wca_id)

    abort "Person #{wca_id} not found" if person.nil?

    person.results.find_each do |result|
      # This will trigger the after_commit hook, which upserts the values into the table
      result.touch
    end
  end
end
