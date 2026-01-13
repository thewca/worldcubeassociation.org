require 'csv'

namespace :import do
  desc "Import H2H data from CSV"
  task :h2h_data, [:file_path] => :environment do |_t, args|
    file_path = args[:file_path]

    # TODO: Make this a transaction so that we don't get partial imports
    # TODO: Add support for multiple rounds in one file
    CSV.foreach(file_path, headers: true) do |row|
      puts "considering #{row}"

      round_id    = row['round_id'].to_i
      match_number   = row['Match # '].to_i
      set_number     = row['Set #'].to_i
      attempt_number = row['Attempt number'].to_i
      registration_id     = row['registration_id'].to_i
      value  = row['Time (seconds)'].sub(".", "").to_i

      # First find/create the H2H infrastructure models
      result = LiveResult.find_or_create_by!(registration_id: registration_id, round_id: round_id) do |lr|
        lr.average = 0
        lr.best = 0
        lr.last_attempt_entered_at = DateTime.now
      end

      match = H2hMatch.find_or_create_by!(round_id: round_id, match_number: match_number)
      competitor = H2hCompetitor.find_or_create_by!(h2h_match_id: match.id, user_id: Registration.find(registration_id).user.id)

      set = H2hSet.find_or_create_by!(h2h_match_id: match.id, set_number: set_number)

      # Now we can create the attempt-specific records
      live_attempt = LiveAttempt.create!(
        value: value,
        attempt_number: H2hAttempt.where(h2h_competitor_id: competitor).count + 1,
        live_result: result,
      )
      puts live_attempt.errors unless live_attempt.valid?

      h2h_attempt = H2hAttempt.create!(
        h2h_set: set,
        live_attempt: live_attempt,
        h2h_competitor: competitor,
        set_attempt_number: H2hAttempt.where(h2h_set_id: set, h2h_competitor_id: competitor).count + 1,
      )
      puts h2h_attempt.errors unless h2h_attempt.valid?
    end

    puts "Import complete!"
  end
end
