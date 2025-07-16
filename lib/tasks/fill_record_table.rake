# frozen_string_literal: true

RECORD_TO_ENUM = { "AfR" => :continental,
                   "ER" => :continental,
                   "NAR" => :continental,
                   "SAR" => :continental,
                   "AsR" => :continental,
                   "OcR" => :continental,
                   "WR" => :world,
                   "NR" => :national }.freeze

namespace :records do
  desc "Fills records table from results"
  task fill_records_table: [:environment] do
    [
      { record_type: 'single', field: :regional_single_record, record_value: 'best' },
      { record_type: 'average', field: :regional_average_record, record_value: 'average' },
    ].each do |records|
      # We do NRs later, because we want to add them for CRs and WRs as well
      (Result::MARKERS - ["NR"]).compact.each do |marker|
        record_scope = RECORD_TO_ENUM[marker]
        ActiveRecord::Base.connection.execute(<<~SQL.squish)
          INSERT INTO regional_records (record_type, result_id, value, event_id, country_id, continent_id, record_timestamp, record_scope, created_at, updated_at)
          SELECT '#{records[:record_type]}', results.id, results.#{records[:record_value]}, results.event_id, results.country_id, countries.continent_id, result_timestamps.round_timestamp, #{RegionalRecord.record_scopes[record_scope]}, NOW(), NOW()
          FROM results
          INNER JOIN result_timestamps ON result_timestamps.result_id = results.id
          INNER JOIN countries ON countries.id = results.country_id
          WHERE #{records[:field]} = '#{marker}';
        SQL
      end

      # Now also add CR for each WR
      ActiveRecord::Base.connection.execute(<<~SQL.squish)
        INSERT INTO regional_records (record_type, result_id, value, event_id, country_id, continent_id, record_timestamp, record_scope, created_at, updated_at)
        SELECT '#{records[:record_type]}', results.id, results.#{records[:record_value]}, results.event_id, results.country_id, countries.continent_id, result_timestamps.round_timestamp, #{RegionalRecord.record_scopes[:continental]}, NOW(), NOW()
        FROM results
        INNER JOIN result_timestamps ON result_timestamps.result_id = results.id
        INNER JOIN countries ON countries.id = results.country_id
        WHERE #{records[:field]} = 'WR';
      SQL

      # And NRs for every kind of record
      ActiveRecord::Base.connection.execute(<<~SQL.squish)
        INSERT INTO regional_records (record_type, result_id, value, event_id, country_id, continent_id, record_timestamp, record_scope, created_at, updated_at)
        SELECT '#{records[:record_type]}', results.id, results.#{records[:record_value]}, results.event_id, results.country_id, countries.continent_id, result_timestamps.round_timestamp, #{RegionalRecord.record_scopes[:national]}, NOW(), NOW()
        FROM results
        INNER JOIN result_timestamps ON result_timestamps.result_id = results.id
        INNER JOIN countries ON countries.id = results.country_id
        WHERE #{records[:field]} IS NOT NULL;
      SQL
    end
  end
end
