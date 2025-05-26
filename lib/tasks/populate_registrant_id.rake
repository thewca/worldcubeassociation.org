# frozen_string_literal: true

namespace :registrant_id do
  desc 'Backfills all registration.registrant_id values with their WCIF-generated registrant_id'
  task :populate do
    Competition.each do |comp|
      comp.persons_wcif

    end
  end
end
