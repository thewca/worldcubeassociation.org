# frozen_string_literal: true

namespace :records do
  desc "Fills records table from results"
  task fill_results_table: [:environment] do
    Result.includes([:competition, :round_type]).where.not(regional_single_record:nil).find_each do |result|
      round = result.round
      has_round_schedule = result.competition.schedule_must_match_rounds
      record_timestamp = has_round_schedule ? round.end_time : result.competition.end_date
      is_cr = Record::CONTINENT_TO_RECORD_MARKER.value?(result.regional_single_record)
      record_scope = is_cr ? Record::CONTINENT_TO_RECORD_MARKER[result.continent_id] : result.regional_single_record
      Record.create(record_type: 'single',
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
