# frozen_string_literal: true

namespace :registration_version do
  desc "Migrates a Competition from V1 to V3"
  task :migrate_v1_v3, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    if competition_id.blank?
      abort "Competition id is required"
    end

    competition = Competition.find(competition_id)

    if competition.nil?
      abort "Competition #{competition_id} not found"
    end

    unless competition.registration_version_v1?
      abort "Competition #{competition_id} is not on version 1"
    end

    ActiveRecord::Base.transaction do
      competition.registrations.each do |registration|
        registration.update_column :competing_status, registration.compute_competing_status
      end

      competition.update_column :registration_version, :v3
    end
  end

  task :migrate_v2_v3, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    if competition_id.blank?
      abort "Competition id is required"
    end

    competition = Competition.find(competition_id)

    if competition.nil?
      abort "Competition #{competition_id} not found"
    end

    unless competition.registration_version_v2?
      abort "Competition #{competition_id} is not on version 2"
    end

    ActiveRecord::Base.transaction do
      competition.microservice_registrations.each do |registration|
        # Create new registration
        new_registration = Registration.create(competition_id: competition_id,
                                               user_id: registration.user_id,
                                               comments: registration.comments,
                                               guests: registration.guests,
                                               competing_status: registration.competing_status,
                                               administrative_notes: registration.administrative_notes,
                                               registration_competition_events: registration.event_ids do |event_id|
                                                 competition_event = competition.competition_events.find { |ce| ce.event_id == event_id }
                                                 { competition_event_id: competition_event.id }
                                               end)

        # Point any payments to the new holder
        if competition.using_payment_integrations?
          payment_intents = registration.payment_intents
          payment_intents.update_all(holder_id: new_registration.id)
        end

        changes = new_registration.changes.transform_values { |change| change[1] }
        changes[:event_ids] = registration.event_ids
        new_registration.add_history_entry(changes, "rake task", user_id, "V2 -> V3 Migration")
      end

      competition.update_column :registration_version, :v3
    end
  end
end
