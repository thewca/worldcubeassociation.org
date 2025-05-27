# frozen_string_literal: true

namespace :round_type_id do
  desc "Tries to backfill round information into Results"
  task :migrate_results, [:strict] => [:environment] do |_, args|
    rounds_cache = Hash.new { |h, k| h[k] = Hash.new(&h.default_proc) }

    strict_mode = args[:strict].present?

    Result.includes(competition: :rounds)
          .where(round: nil)
          .find_each do |result|
      puts "Progress: Result ##{result.id}" if (result.id % 1000).zero?

      cached_round = rounds_cache.dig(
        result.competition_id,
        result.event_id,
        result.round_type_id,
        result.format_id,
      ).presence

      matched_round = cached_round || result.competition&.find_round_for(
        result.event_id,
        result.round_type_id,
        result.format_id,
      )

      raise "Round not found: (#{result.competition_id}, #{result.event_id}, #{result.round_type_id}, #{result.format_id}) for ID ##{result.id}" if strict_mode && matched_round.nil?

      rounds_cache[result.competition_id][result.event_id][result.round_type_id][result.format_id] = matched_round if matched_round.present?

      # Skipping validation here because we have historic results whose average computation
      #   is not consistent with modern standards / regulations
      result.update_attribute(:round, matched_round)

      result.linked_round_consistent # trigger this specific validation only
      raise "Matched round not consistent, how did this happen?! #{result.id}" if result.errors.present?
    end
  end

  desc "Tries to backfill round information into Scrambles"
  task migrate_scrambles: [:environment] do
    rounds_cache = Hash.new { |h, k| h[k] = Hash.new(&h.default_proc) }

    Scramble.includes(competition: :rounds)
            .where(round: nil)
            .find_each do |scramble|
      puts "Progress: Scramble ##{scramble.id}" if (scramble.id % 1000).zero?

      cached_round = rounds_cache.dig(
        scramble.competition_id,
        scramble.event_id,
        scramble.round_type_id,
      ).presence

      matched_round = cached_round || scramble.competition&.find_round_for(
        scramble.event_id,
        scramble.round_type_id,
      )

      rounds_cache[scramble.competition_id][scramble.event_id][scramble.round_type_id] = matched_round if matched_round.present?

      scramble.update!(round: matched_round)
    end
  end
end
