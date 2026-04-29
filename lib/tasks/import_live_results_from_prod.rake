# frozen_string_literal: true

require 'net/http'

namespace :live_results do
  desc "Import live results from production API for a given round. Usage: rake 'live_results:import_from_prod[MunichOpen2026,sq1-r1]'"
  task :import_from_prod, %i[competition_id round_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]
    round_id = args[:round_id]

    abort "competition_id and round_id are required" if competition_id.blank? || round_id.blank?

    competition = Competition.find_by(id: competition_id)
    abort "Competition #{competition_id} not found locally" if competition.nil?

    round = Round.find_by_wcif_id!(round_id, competition)
    abort "Round #{round_id} not found locally" if round.nil?

    url = "https://www.worldcubeassociation.org/api/v1/competitions/#{competition_id}/live/rounds/#{round_id}"
    puts "Fetching #{url}..."
    response = Net::HTTP.get_response(URI(url))
    abort "API request failed: #{response.code} #{response.message}" unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)

    # Build a map from prod registration_id -> registrant_id using competitors array
    prod_reg_id_to_registrant_id = data["competitors"].index_by { it["id"] }.transform_values { it["registrant_id"] }

    # Build a map from registrant_id -> local registration
    local_registrations = competition.registrations.index_by(&:registrant_id)

    ActiveRecord::Base.transaction do
      puts "Clearing existing live results for #{round_id}..."
      round.live_results.destroy_all

      results = data["results"]
      puts "Importing #{results.length} results..."

      results.each do |result|
        registrant_id = prod_reg_id_to_registrant_id[result["registration_id"]]
        local_registration = local_registrations[registrant_id]

        unless local_registration
          puts "  Warning: no local registration found for registrant_id=#{registrant_id}, skipping"
          next
        end

        attempts = (result["attempts"] || []).map do |a|
          LiveAttempt.new(attempt_number: a["attempt_number"], value: a["value"])
        end

        LiveResult.create!(
          round: round,
          registration: local_registration,
          best: result["best"],
          average: result["average"],
          advancing: result["advancing"] || false,
          advancing_questionable: result["advancing_questionable"] || false,
          single_record_tag: result["single_record_tag"],
          average_record_tag: result["average_record_tag"],
          global_pos: result["global_pos"],
          local_pos: result["local_pos"],
          last_attempt_entered_at: result["last_attempt_entered_at"] || Time.now.utc,
          live_attempts: attempts,
        )
      end

      puts "Done. Imported #{results.length} results."
    end
  end
end
