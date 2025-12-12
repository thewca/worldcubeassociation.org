# frozen_string_literal: true

namespace :results do
  desc "Migrates all results to attempts"
  task migrate_attempts: [:environment] do
    ActiveRecord::Base.connection.execute <<-SQL.squish
    INSERT IGNORE INTO result_attempts (value, attempt_number, result_id)
    SELECT value1, 1, id FROM results WHERE value1 != 0
    UNION ALL
    SELECT value2, 2, id FROM results WHERE value2 != 0
    UNION ALL
    SELECT value3, 3, id FROM results WHERE value3 != 0
    UNION ALL
    SELECT value4, 4, id FROM results WHERE value4 != 0
    UNION ALL
    SELECT value5, 5, id FROM results WHERE value5 != 0
    SQL
  end

  desc "Check if the attempts table is correct"
  task check_attempts: :environment do
    sql = <<-SQL.squish
    SELECT ra.id, ra.result_id, ra.attempt_number, ra.value,
           r.value1, r.value2, r.value3, r.value4, r.value5
    FROM result_attempts ra
    JOIN results r ON ra.result_id = r.id
    WHERE (ra.attempt_number = 1 AND ra.value <> r.value1)
       OR (ra.attempt_number = 2 AND ra.value <> r.value2)
       OR (ra.attempt_number = 3 AND ra.value <> r.value3)
       OR (ra.attempt_number = 4 AND ra.value <> r.value4)
       OR (ra.attempt_number = 5 AND ra.value <> r.value5)
    SQL

    mismatches = ActiveRecord::Base.connection.exec_query(sql)
    if mismatches.any?
      puts "Found #{mismatches.count} mismatches"
      mismatches.each do |mismatch|
        puts mismatch.inspect
      end
    else
      puts "All result_attempts match results"
    end
  end

  desc "Migrates results from one competition to attempts"
  task :migrate_competition_results, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    abort "Competition id is required" if competition_id.blank?

    competition = Competition.find(competition_id)

    abort "Competition #{competition_id} not found" if competition.nil?

    competition.results.find_each(&:create_or_update_attempts)
  end

  desc "Migrates results from one person to attempts"
  task :migrate_person_results, [:wca_id] => [:environment] do |_, args|
    wca_id = args[:wca_id]

    abort "WCA ID is required" if wca_id.blank?

    person = Person.find_by(wca_id: wca_id)

    abort "Person #{wca_id} not found" if person.nil?

    person.results.find_each(&:create_or_update_attempts)
  end
end
