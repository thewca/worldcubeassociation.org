# frozen_string_literal: true

def migrate_rounds(model_class, strict_mode: false, reporting: 1000)
  start_time = Time.now
  entries_processed = 0
  entries_processed_total = 0
  average_speed = 0
  times_reported = 0
  total_pending = model_class.where(round: nil).count

  fields = %i[competition_id event_id round_type_id format_id] & model_class.column_names.map(&:to_sym)

  model_class.where(round: nil)
             .select(*fields)
             .distinct
             .each do |model| # Cannot use `find_each` here because the `id` field used for batching is not part of the DISTINCT
    if entries_processed >= reporting
      measure_time = Time.now

      time_taken = measure_time - start_time
      current_measurement_speed = entries_processed / time_taken

      times_reported += 1
      average_speed += (current_measurement_speed - average_speed) / times_reported

      puts "Progress: #{model_class} #{entries_processed_total} entries (#{total_pending - entries_processed_total} pending), speed: #{current_measurement_speed.round(3)} entries/sec (avg: #{average_speed.round(3)} entries/sec)"

      start_time = measure_time.clone
      entries_processed = 0
    end

    round_data = model.slice(*fields).symbolize_keys

    round_info = round_data.slice(:format_id)
    competition_event_info = round_data.slice(:competition_id, :event_id)

    matched_round = Round.joins(:competition_event)
                         .where(competition_event: competition_event_info, **round_info)
                         .find { it.round_type_id == model.round_type_id }

    raise "#{model_class} not found: (#{round_data})" if strict_mode && matched_round.nil?

    rows_updated = model_class.where(**round_data).update_all(round_id: matched_round.id)

    entries_processed += rows_updated
    entries_processed_total += rows_updated
  end
end

namespace :round_type_id do
  desc "Tries to backfill round information into Results"
  task :migrate_results, [:strict] => [:environment] do |_, args|
    strict_mode = args[:strict].present?

    migrate_rounds(Result, strict_mode: strict_mode)
  end

  desc "Tries to backfill round information into Scrambles"
  task migrate_scrambles: :environment do
    migrate_rounds(Scramble)
  end
end
