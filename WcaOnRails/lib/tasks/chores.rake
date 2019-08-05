# frozen_string_literal: true

namespace :chores do
  desc 'Pick a WST member at random to send the monthly digest to WCA Staff.'
  task generate: :environment do
    GenerateChore.perform_later
  end
end
