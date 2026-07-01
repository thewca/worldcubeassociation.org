# frozen_string_literal: true

namespace :live_results do
  desc "Sanity check: for rounds with both round_results and live_results, verify they are identical"
  task sanity_check: :environment do
    discrepancy_count = 0
    checked_count = 0

    rounds = Round.joins(:live_results)
                  .where("round_results IS NOT NULL AND round_results != '[]'")
                  .includes(:competition_event, :competition)
                  .distinct

    puts "Checking #{rounds.count} rounds with both round_results and live_results..."

    rounds.find_each do |round|
      # For internal-scoretaking competitions `round_results` is dead data: `Round#to_wcif`
      #   always serves `live_results` for them, never `round_results`. The latter is only ever
      #   a stale WCIF-PATCH snapshot, so comparing the two just produces noise.
      next if round.competition.scoretaking_software_internal?

      round_wcif = round.round_results.map(&:to_wcif).index_by { it["personId"] }
      live_wcif = round.live_results.includes(:live_attempts, :registration).map(&:to_wcif).index_by { it["personId"] }

      checked_count += 1
      round_ids = round_wcif.keys.to_set
      live_ids = live_wcif.keys.to_set

      if round_ids != live_ids
        discrepancy_count += 1
        puts "MISMATCH #{round.wcif_id}: person_ids differ"
        puts "  only in round_results: #{(round_ids - live_ids).to_a.sort}"
        puts "  only in live_results:  #{(live_ids - round_ids).to_a.sort}"
        next
      end

      round_ids.each do |person_id|
        rr = round_wcif[person_id]
        lr = live_wcif[person_id]

        next if rr == lr

        discrepancy_count += 1
        puts "MISMATCH #{round.wcif_id} personId=#{person_id} competition_id=#{round.competition_id}:"
        puts "  ranking:  round=#{rr['ranking']}  live=#{lr['ranking']}" if rr["ranking"] != lr["ranking"]
        puts "  best:     round=#{rr['best']}     live=#{lr['best']}" if rr["best"] != lr["best"]
        puts "  average:  round=#{rr['average']}  live=#{lr['average']}" if rr["average"] != lr["average"]
        if rr["attempts"] != lr["attempts"]
          puts "  attempts: round=#{rr['attempts'].map { it['result'] }.inspect}"
          puts "            live= #{lr['attempts'].map { it['result'] }.inspect}"
        end
      end
    end

    puts "\nChecked #{checked_count} rounds. #{discrepancy_count} discrepanc#{discrepancy_count == 1 ? 'y' : 'ies'} found."
  end
end
