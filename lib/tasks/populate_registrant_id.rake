# frozen_string_literal: true

namespace :registrant_id do
  desc 'Backfills all registration.registrant_id values with their WCIF-generated registrant_id'
  task populate: :environment do
    Competition.find_each do |competition|
      puts "Setting registrant_ids for #{competition.id}"
      ActiveRecord::Base.connection.execute(<<~SQL)
           WITH wcif_ordered AS (
             SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS registrant_id
             FROM registrations
             WHERE competition_id = '#{competition.id}'
           )
          UPDATE registrations
          JOIN wcif_ordered ON registrations.id = wcif_ordered.id
          SET registrations.registrant_id = wcif_ordered.registrant_id
        SQL
    end
  end

  task verify: :environment do
    inconsistencies = []
    comps = Competition.where("end_date > '2025-05-01'")
    comps.find_each do |comp|
      puts "Checking #{comp.id}"

      changes = comp.persons_wcif(authorized: true).filter_map do |person|
        next if person['registration'].nil?
        [person['registration']['wcaRegistrationId'], person['registrantId']]
      end.to_h

      differences = Registration.find(changes.keys).filter_map { it.registrant_id != changes[it.id] ? it.id : nil }
      puts "Differences found: #{differences}" unless differences.empty?

      inconsistencies.concat(differences)
    end
    puts "Inconsistencies: #{inconsistencies}"
  end
end
