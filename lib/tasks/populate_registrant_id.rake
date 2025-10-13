# frozen_string_literal: true

namespace :registrant_id do
  desc 'Backfills all registration.registrant_id values with their WCIF-generated registrant_id'
  task populate: :environment do
    ActiveRecord::Base.connection.execute(<<~SQL.squish)
       WITH wcif_ordered AS (
         SELECT id, ROW_NUMBER() OVER (PARTITION BY competition_id ORDER BY id) AS registrant_id
         FROM registrations
       )
      UPDATE registrations
      JOIN wcif_ordered ON registrations.id = wcif_ordered.id
      SET registrations.registrant_id = wcif_ordered.registrant_id
    SQL
  end

  desc 'Checks that the backfill completed in `populate` is consistent with the WCIF-generated registrant_ids'
  task verify: :environment do
    inconsistencies = []
    comps = Competition.where("end_date > '2025-05-01'")
    comps.find_each do |comp|
      puts "Checking #{comp.id}"

      changes = comp.persons_wcif(authorized: true).filter_map do |person|
        next if person['registration'].nil?

        [person['registration']['wcaRegistrationId'], person['registrantId']]
      end.to_h

      differences = Registration.find(changes.keys).filter_map { it.registrant_id == changes[it.id] ? nil : it.id }
      puts "Differences found: #{differences}" unless differences.empty?

      inconsistencies.concat(differences)
    end

    if inconsistencies.empty?
      puts "Validation successful - no inconsistencies found"
    else
      puts "The following registration_ids had inconsistencies between their WCIF-generated registrant_id and task-generated registrant_id:"
      puts inconsistencies
    end
  end
end
