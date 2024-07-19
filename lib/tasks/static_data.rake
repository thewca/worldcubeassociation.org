# frozen_string_literal: true

STATIC_MODELS = [
  EligibleCountryIso2ForChampionship,
  Continent,
  Country,
  Event,
  Format,
  PreferredFormat,
  RoundType,
].freeze

namespace :static_data do
  desc 'Import static data from JSON files under lib/static_data into the database'
  task load_json: :environment do
    STATIC_MODELS.each(&:load_json_data!)
  end

  desc 'Dump static data from the database into JSON files under lib/static_data'
  task dump_json: :environment do
    STATIC_MODELS.each(&:write_json_data!)
  end
end

if Rails.env.production? && Rake::Task.task_defined?("db:prepare")
  Rake::Task["db:prepare"].enhance do
    Rake::Task["static_data:load_json"].invoke
  end
end
