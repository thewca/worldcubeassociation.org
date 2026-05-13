# frozen_string_literal: true

namespace :result_conditions do
  desc "Migrate over the advancement_condition fields into new participation_ruleset structure"
  task migrate_rounds: :environment do
    Competition.includes(competition_events: :rounds).find_each do |competition|
      puts "Migrating competition #{competition.id}"

      competition.competition_events.each do |competition_event|
        all_ce_rounds = competition_event.rounds

        all_ce_rounds.each do |round|
          round.assign_attributes(**Round.backport_participation_ruleset(round, all_ce_rounds))
          # Circumventing validations here on purpose to bypass validations,
          #   because we have a LOT of rounds which were historically valid
          #   but are not valid any longer (think 333ft or switching from 333bf Mo3 to Ao5)
          round.save!(validate: false)
        end
      end
    end
  end

  desc "Migrate over the qualification fields into new participation_condition structure"
  task migrate_competition_events: :environment do
    Competition.includes(:competition_events).find_each do |competition|
      puts "Migrating competition #{competition.id}"

      competition.competition_events.each do |competition_event|
        competition_event.assign_attributes(
          qualification_latest_date: competition_event.qualification&.when_date,
          qualification_condition: ResultConditions::Utils.upcycle_v1_qualification(competition_event.qualification),
        )

        # Circumventing validations here on purpose to bypass validations,
        #   because we have a LOT of rounds which were historically valid
        #   but are not valid any longer (think 333ft or switching from 333bf Mo3 to Ao5)
        competition_event.save!(validate: false)
      end
    end
  end
end
