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

  desc 'Dump the currency subunit table from the money gem into lib/static_data'
  task dump_currency_subunits: :environment do
    # The frontends are handed amounts in a currency's smallest unit, so they need the same divisor
    # the money gem gives Rails - CLDR (and thus `Intl`) disagrees with it for a number of live
    # currencies, HUF among them.
    subunits = Money::Currency.table
                              .select { |key, currency| key.to_s == currency[:iso_code].downcase }
                              .to_h { |_, currency| [currency[:iso_code], currency[:subunit_to_unit]] }
                              .sort
                              .to_h

    Rails.root.join('lib/static_data/currency_subunits.json').write("#{JSON.pretty_generate(subunits)}\n")
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
