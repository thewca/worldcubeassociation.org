# frozen_string_literal: true

require 'csv'

namespace :h2h_results do
  desc "Import H2H data from CSV"
  task :import, [:file_path] => :environment do |_t, args|
    file_path = args[:file_path]

    # TODO: Add test that confirms support for multiple rounds in one file
    ActiveRecord::Base.transaction do
      CSV.foreach(file_path, headers: true) do |row|
        puts "considering #{row}"

        round_id = row['round_id'].to_i
        match_number   = row['match_number'].to_i
        set_number     = row['match_set_number'].to_i
        row['set_attempt_number'].to_i
        registration_id = row['registration_id'].to_i
        final_pos = row['final_position'].to_i
        value = row['time_seconds'].sub(".", "").to_i
        scramble_set_number = row['scramble_set_number'].to_i
        scramble_number = row['scramble_number'].to_i
        is_extra = row['is_extra'].to_i
        scramble = row['scramble']

        # First find/create the H2H infrastructure models
        result = LiveResult.find_or_create_by!(registration_id: registration_id, round_id: round_id) do |lr|
          lr.average = 0
          lr.best = value
          lr.last_attempt_entered_at = DateTime.now
          lr.global_pos = final_pos
          lr.local_pos = final_pos
        end

        result.update!(best: value) if value.positive? && result.best > value

        match = H2hMatch.find_or_create_by!(round_id: round_id, match_number: match_number)
        competitor = H2hMatchCompetitor.find_or_create_by!(h2h_match_id: match.id, user_id: Registration.find(registration_id).user.id)

        set = H2hSet.find_or_create_by!(h2h_match_id: match.id, set_number: set_number)

        # Now we can create the attempt-specific records
        live_attempt = LiveAttempt.create!(
          value: value,
          attempt_number: result.live_attempts.count + 1,
          live_result: result,
        )
        puts live_attempt.errors unless live_attempt.valid?

        h2h_attempt = H2hAttempt.create!(
          h2h_set: set,
          live_attempt: live_attempt,
          h2h_match_competitor: competitor,
          set_attempt_number: H2hAttempt.where(h2h_set_id: set, h2h_match_competitor_id: competitor).count + 1,
        )
        puts h2h_attempt.errors unless h2h_attempt.valid?

        # And finally we can save the attempt's scramble
        scramble_set = InboxScrambleSet.find_or_create_by!(matched_round: Round.find(round_id), scramble_set_number: scramble_set_number) do |set|
          set.competition = set.matched_round.competition
          set.event = set.matched_round.event
          set.round_number = set.matched_round.number
          set.ordered_index = scramble_set_number - 1
        end

        scramble_set.inbox_scrambles.find_or_create_by!(matched_scramble_set: scramble_set, scramble_number: scramble_number) do |inbox_scramble|
          inbox_scramble.is_extra = is_extra
          inbox_scramble.matched_scramble_set = scramble_set
          inbox_scramble.scramble_number = scramble_number
          inbox_scramble.ordered_index = scramble_number - 1
          inbox_scramble.scramble_string = scramble
        end
      end

      puts "Import complete!"
    end
  end

  desc "Graduate H2H data from live tables to results and result_attempts"
  task :post, [:competition_id] => :environment do |_t, args|
    competition = Competition.find(args[:competition_id])
    h2h_rounds = competition.rounds.where(is_h2h_mock: true)

    puts "Posting H2H results for #{competition.id}"

    ActiveRecord::Base.transaction do
      h2h_rounds.each do |r|
        puts "handling round: #{r.inspect}"
        r.live_results.each do |lr|
          puts "> handling live_result: #{lr.inspect}"
          result = Result.new(
            average: 0,
            best: lr.best,
            competition: r.competition,
            round_id: r.id,
            round_type_id: lr.round.round_type_id,
            format_id: lr.round.format.id,
            event_id: lr.round.competition_event.event_id,
            person: lr.registration.person,
            person_name: lr.registration.name,
            country_id: lr.registration.country.id,
            pos: lr.global_pos,
          )

          result_attempts = lr.live_attempts.map { ResultAttempt.new(attempt_number: it.attempt_number, value: it.value) }

          result.result_attempts = result_attempts # Set the in-memory attempts so that the `result` validations pass
          result.save! # Save, but the in-memory result_attempts disappear because of `autosave: false`

          # Iterate over each result_attempt and associate it with the just-created result, so that they can be saved without
          # failing their validations which require a valid result_id
          result_attempts.each do |ra|
            puts ">> creating result_attempt: #{ra.inspect}"
            ra.result = result
            ra.save!
          end

          # Now that we have saved result_attempts, we can point the h2h_attempts to those instead of live_attempts
          lr.live_attempts.each do |la|
            matching_result_attempt = result_attempts.find { it.attempt_number == la.attempt_number }
            la.h2h_attempt.update!(live_attempt: nil, result_attempt: matching_result_attempt)
          end

          puts "destroying live_result #{lr.id}"
          lr.destroy!
        end

        r.matched_scramble_sets.each do |set|
          puts "> handling scramble set: #{set.inspect}"

          # Group ID's have to be letters per our validations, this converts a given group number to an alphabet-based letter code
          group_id = begin
            result = +""
            number = set.scramble_set_number

            while number.positive?
              digit = number % 26
              digit = 26 if digit.zero?

              result << (digit + 64).chr
              number -= digit
              number /= 26
            end

            result.reverse
          end

          set.inbox_scrambles.each do |is|
            Scramble.create!(
              competition: competition,
              round: r,
              round_type_id: r.results.first.round_type_id,
              event_id: r.event_id,
              group_id: group_id,
              is_extra: is.is_extra,
              scramble: is.scramble_string,
              scramble_num: is.scramble_number,
            )
          end

          set.destroy!
        end
      end
    end

    puts "Results posted for #{competition.id}"
  end

  desc 'Remove all data related to a given competition with h2h rounds'
  task :destroy, [:competition_id] => :environment do |_t, args|
    competition = Competition.find(args[:competition_id])
    h2h_rounds = competition.rounds.where(is_h2h_mock: true)
    puts "Removing H2H results for #{competition.id}"

    ActiveRecord::Base.transaction do
      h2h_rounds.each do |r|
        r.live_results.destroy_all
        r.h2h_matches.destroy_all
        r.results.destroy_all
        r.scrambles.destroy_all
        r.matched_scramble_sets.destroy_all
      end
    end
  end
end
