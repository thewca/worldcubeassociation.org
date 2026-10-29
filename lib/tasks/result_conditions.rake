# frozen_string_literal: true

namespace :result_conditions do
  desc "Migrate over the advancement_condition fields into new participation_ruleset structure"
  task :migrate_rounds, [:dry_run] => :environment do |_task, args|
    is_dry_run = args[:dry_run].present?
    is_debug = args[:dry_run] == "debug"

    Competition.includes(competition_events: :rounds).find_each do |competition|
      puts "Migrating competition #{competition.id}" unless is_dry_run

      competition.competition_events.each do |competition_event|
        all_ce_rounds = competition_event.rounds

        all_ce_rounds.each do |round|
          round.assign_attributes(**Round.backport_participation_ruleset(round, all_ce_rounds))

          if is_dry_run
            if round.changed?
              diff = is_debug ? round.changes : round.changed
              puts "Mismatch on Round ##{round.id} (#{competition.id}-#{competition_event.event_id}-#{round.number}): #{diff}"
            end
          else
            # Circumventing validations here on purpose to bypass validations,
            #   because we have a LOT of rounds which were historically valid
            #   but are not valid any longer (think 333ft or switching from 333bf Mo3 to Ao5)
            round.save!(validate: false)
          end
        end
      end
    end
  end
end
