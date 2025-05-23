# frozen_string_literal: true

namespace :records do
  desc "Fills records table from results"
  task fill_records_table: [:environment] do
    [
      { record_type: 'single', field: :regional_single_record },
      { record_type: 'average', field: :regional_average_record }
    ].each do |records|
      Result.includes([:competition, :round_type])
            .where.not(records[:field] => nil)
            .find_each do |result|

        record_value = result.send(records[:field])
        round = result.round
        has_round_schedule = result.competition.start_date > Date.new(2018, 12, 31)
        record_timestamp = has_round_schedule ? round.end_time : result.competition.end_date
        is_cr = Record::CONTINENT_TO_RECORD_MARKER.value?(record_value)
        record_scope = is_cr ? Record::CONTINENT_TO_RECORD_MARKER[result.continent_id] : record_value

        Record.create(
          record_type: records[:record_type],
          result: result,
          value: result.best,
          event_id: result.event_id,
          country_id: result.country_id,
          continent_id: result.continent_id,
          record_timestamp: record_timestamp,
          record_scope: record_scope
        )
      end
    end
  end
end
