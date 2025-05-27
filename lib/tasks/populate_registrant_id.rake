# frozen_string_literal: true

namespace :registrant_id do
  desc 'Backfills all registration.registrant_id values with their WCIF-generated registrant_id'
  task :populate do
    Competition.all.each do |comp|
      puts "Populating registrant ID for #{comp.id}"

      changes = comp.persons_wcif.filter_map do |person|
        next if person['registration'].nil?
        [person['registration']['wcaRegistrationId'], person['registrantId']]
      end.to_h

      puts changes

      ActiveRecord::Base.connection.transaction do
        Registration.find(changes.keys).each { it.update(registrant_id: changes[it.id]) }
      end
      break
    end
  end
end
