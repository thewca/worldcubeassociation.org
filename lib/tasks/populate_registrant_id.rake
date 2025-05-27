# frozen_string_literal: true

namespace :registrant_id do
  desc 'Backfills all registration.registrant_id values with their WCIF-generated registrant_id'
  task :populate do
    Competition.all.each do |comp|
      puts "Populating registrant ID for #{comp.id}"
      changes = comp.persons_wcif.map do |person|
        { id: person['registration']['wcaRegistrationId'], registrant_id: person['registrantId'] } if
          person['registration'].present?
      end

      ids = changes.map { it[:id] }
      existing_ids = Registration.where(id: ids).pluck(:id)
      missing_ids = ids - existing_ids

      puts "> Missing ids: "
      puts missing_ids

      puts "> Changes"
      puts changes

      pp changes.reject { |c| c[:id].is_a?(Integer) && c[:registrant_id].present? }

      Registration.upsert_all(changes)
    end
  end
end
