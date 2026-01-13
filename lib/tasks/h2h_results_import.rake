require 'csv'

namespace :import do
  desc "Import H2H data from CSV"
  task :h2h_data, [:file_path] => :environment do |_t, args|
    file_path = args[:file_path]

    # VERY BAD AI GENERATED TEMPLATE
    CSV.foreach(file_path, headers: true) do |row|
      round_id    = row['round_id'].to_i
      match_num   = row['Match # '].to_i
      set_num     = row['Set #'].to_i
      attempt_num = row['Attempt number'].to_i
      user_id     = row['user_id'].to_i
      time_taken  = row['Time (seconds)'].to_f

      result = Result.find_or_create_by(user_id: user_id, round_id: round_id) do |r|
        # TODO
      end

      h2h_match = H2HMatch.find_or_create_by(round_id: round_id, id: match_num)

      participant = h2h_match.h2h_match_participants.find_or_initialize_by(user_id: user_id)
      if participant.new_record?
        # Assign slot_number based on how many participants already exist (1 or 2)
        participant.slot_number = h2h_match.h2h_match_participants.count + 1
        participant.save!
      end

      # 4. Find or Create the H2HSet within the Match
      h2h_set = h2h_match.h2h_sets.find_or_create_by(set_number: set_num)

      # 5. Create the ResultAttempt
      result_attempt = ResultAttempt.create!(
        result: result,
        # Fill in other details like time_taken here
      )

      # 6. Create the H2HAttempt
      # Links the H2HSet to the specific ResultAttempt
      H2HAttempt.find_or_create_by!(
        h2h_set: h2h_set,
        result_attempt: result_attempt,
        set_attempt_number: attempt_num
      )
    end

    puts "Import complete!"
  end
end
