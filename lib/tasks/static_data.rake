# frozen_string_literal: true

namespace :static_data do
  desc 'Import static data from JSON files under lib/static_data into the database'
  task load_json: :environment do
    EligibleCountryIso2ForChampionship.load_json_data!
    Continent.load_json_data!
    Country.load_json_data!
    Event.load_json_data!
    Format.load_json_data!
    PreferredFormat.load_json_data!
    RoundType.load_json_data!
    SanityCheckCategory.load_json_data!
    SanityCheck.load_json_data!
  end

  desc 'Dump static data from the database into JSON files under lib/static_data'
  task dump_json: :environment do
    EligibleCountryIso2ForChampionship.write_json_data!
    Continent.write_json_data!
    Country.write_json_data!
    Event.write_json_data!
    Format.write_json_data!
    PreferredFormat.write_json_data!
    RoundType.write_json_data!
    SanityCheckCategory.write_json_data!
    SanityCheck.write_json_data!
  end
end

if Rails.env.production? && Rake::Task.task_defined?("db:prepare")
  Rake::Task["db:prepare"].enhance do
    Rake::Task["static_data:load_json"].invoke
  end
end
