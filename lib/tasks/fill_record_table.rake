# frozen_string_literal: true

namespace :records do
  desc "Fills records table from results"
  task fill_records_table: [:environment] do
    [
      { record_type: 'single', field: :regional_single_record, record_value: 'best' },
      { record_type: 'average', field: :regional_average_record, record_value: 'average' },
    ].each do |records|
      Result::MARKERS.compact.each do |marker|
        is_cr = RegionalRecord::CONTINENT_TO_RECORD_MARKER.value?(marker)
        record_scope = is_cr ? :CR : marker.to_sym
        ActiveRecord::Base.connection.execute(<<~SQL)
        INSERT INTO regional_records (record_type, result_id, value, event_id, country_id, continent_id, record_timestamp, record_scope, created_at, updated_at)
        SELECT '#{records[:record_type]}', results.id, results.#{records[:record_value]}, results.event_id, results.country_id, countries.continent_id, result_timestamps.round_timestamp, #{RegionalRecord.record_scopes[record_scope]}, NOW(), NOW()
        FROM results
        INNER JOIN result_timestamps ON result_timestamps.result_id = results.id
        INNER JOIN countries ON countries.id = results.country_id
        WHERE #{records[:field]} = '#{marker}';
      SQL
      end

      # Now also add CR for each WR
      ActiveRecord::Base.connection.execute(<<~SQL)
        INSERT INTO regional_records (record_type, result_id, value, event_id, country_id, continent_id, record_timestamp, record_scope, created_at, updated_at)
        SELECT '#{records[:record_type]}', results.id, results.#{records[:record_value]}, results.event_id, results.country_id, countries.continent_id, result_timestamps.round_timestamp, #{RegionalRecord.record_scopes[:CR]}, NOW(), NOW()
        FROM results
        INNER JOIN result_timestamps ON result_timestamps.result_id = results.id
        INNER JOIN countries ON countries.id = results.country_id
        WHERE #{records[:field]} = 'WR';
      SQL

      # And NRs for each CR/WR
      ActiveRecord::Base.connection.execute(<<~SQL)
        INSERT INTO regional_records (record_type, result_id, value, event_id, country_id, continent_id, record_timestamp, record_scope, created_at, updated_at)
        SELECT '#{records[:record_type]}', results.id, results.#{records[:record_value]}, results.event_id, results.country_id, countries.continent_id, result_timestamps.round_timestamp, #{RegionalRecord.record_scopes[:NR]}, NOW(), NOW()
        FROM results
        INNER JOIN result_timestamps ON result_timestamps.result_id = results.id
        INNER JOIN countries ON countries.id = results.country_id
        WHERE #{records[:field]} IN ['CR', 'WR'];
      SQL
    end
  end
end
