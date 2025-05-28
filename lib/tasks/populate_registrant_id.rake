# frozen_string_literal: true

namespace :registrant_id do
  desc 'Backfills all registration.registrant_id values with their WCIF-generated registrant_id'
  task populate: :environment do
    Competition.in_batches(of: 30) do |batch|
      ActiveRecord::Base.connection.transaction do
        batch.each do |comp|
          puts "Populating registrant ID for #{comp.id}"

          changes = comp.persons_wcif(authorized: true).filter_map do |person|
            next if person['registration'].nil?

            [person['registration']['wcaRegistrationId'], person['registrantId']]
          end.to_h

          puts changes

          Registration.find(changes.keys).each { it.update(registrant_id: changes[it.id]) }
        end
      end
      break
    end
  end
end
