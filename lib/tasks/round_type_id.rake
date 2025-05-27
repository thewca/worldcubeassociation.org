# frozen_string_literal: true

def migrate_rounds(model_class, strict_mode: false, reporting: 1000, &)
  rounds_cache = Hash.new { |h, k| h[k] = Hash.new(&h.default_proc) }

  start_time = Time.now
  entries_processed = 0
  average_speed = 0
  times_reported = 0

  model_class.includes(competition: :rounds)
             .where(round: nil)
             .find_each do |model|
    if (entries_processed % reporting).zero? && entries_processed.positive?
      measure_time = Time.now

      time_taken = measure_time - start_time
      current_measurement_speed = entries_processed / time_taken

      times_reported += 1
      average_speed += (current_measurement_speed - average_speed) / times_reported

      puts "Progress: #{model_class} ##{model.id}, speed: #{current_measurement_speed.round(3)} entries/sec (avg: #{average_speed.round(3)} entries/sec)"

      start_time = measure_time.clone
      entries_processed = 0
    end

    maybe_format_id = model.try(:format_id)

    cache_keys = [
      model.competition_id,
      model.event_id,
      model.round_type_id,
      maybe_format_id,
    ].compact

    cached_round = rounds_cache.dig(*cache_keys).presence

    matched_round = cached_round || model.competition&.find_round_for(
      model.event_id,
      model.round_type_id,
      maybe_format_id,
    )

    raise "#{model_class} not found: (#{cache_keys.join}) for ID ##{model.id}" if strict_mode && matched_round.nil?

    if matched_round.present?
      if maybe_format_id.present?
        rounds_cache[model.competition_id][model.event_id][model.round_type_id][maybe_format_id] = matched_round
      else
        rounds_cache[model.competition_id][model.event_id][model.round_type_id] = matched_round
      end
    end

    yield model, matched_round
    entries_processed += 1
  end
end

namespace :round_type_id do
  desc "Tries to backfill round information into Results"
  task :migrate_results, [:strict] => [:environment] do |_, args|
    strict_mode = args[:strict].present?

    migrate_rounds(Result, strict_mode: strict_mode) do |result, matched_round|
      # Skipping validation here because we have historic results whose average computation
      #   is not consistent with modern standards / regulations
      result.update_attribute(:round, matched_round)

      result.linked_round_consistent # trigger this one specific validation only
      raise "Matched round not consistent, how did this happen?! #{result.id}" if result.errors.present?
    end
  end

  desc "Tries to backfill round information into Scrambles"
  task migrate_scrambles: [:environment] do
    migrate_rounds(Scramble) do |scramble, matched_round|
      scramble.update!(round: matched_round)
    end
  end
end
