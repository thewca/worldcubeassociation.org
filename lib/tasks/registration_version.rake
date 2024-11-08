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

    LogTask.log_task("Migrating Registrations for Competition #{competition_id}") do
      ActiveRecord::Base.transaction do
        competition.registrations.each do |registration|
          registration.update_column :competing_status, registration.compute_competing_status
          if registration.accepted_at.present?
            registration.add_history_entry({ competing_status: 'accepted' }, "user", registration.accepted_by, "V2 Migration", registration.accepted_at)
          end
          if registration.deleted_at.present?
            registration.add_history_entry({ competing_status: 'cancelled' }, "user", registration.deleted_by, "V2 Migration", registration.deleted_at)
          end
          registration.add_history_entry({
                                           competing_status: 'pending',
                                           event_ids: registration.event_ids,
                                           comments: registration.comments,
                                           guests: registration.guests,
                                         },
                                         "user", registration.user_id,
                                         "V2 Migration",
                                         registration.created_at)
        end

        competition.registration_version_v3!
      end
    end
  end

  task :migrate_v2_v3, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    if competition_id.blank?
      abort "Competition id is required"
    end

    competition = Competition.includes(:competition_events).find(competition_id)

    if competition.nil?
      abort "Competition #{competition_id} not found"
    end

    unless competition.registration_version_v2?
      abort "Competition #{competition_id} is not on version 2"
    end

    LogTask.log_task("Migrating Registrations for Competition #{competition_id}") do
      ActiveRecord::Base.transaction do
        competition.microservice_registrations.includes(:payment_intents).each do |registration|
          new_registration = Registration.create!(competition_id: competition_id,
                                                  user_id: registration.user_id,
                                                  comments: registration.comments,
                                                  guests: registration.guests,
                                                  competing_status: registration.competing_status,
                                                  administrative_notes: registration.administrative_notes,
                                                  registration_competition_events: registration.event_ids.map do |event_id|
                                                    RegistrationCompetitionEvent.build(competition_event: competition.competition_events.find { |ce| ce.event_id == event_id })
                                                  end)

          # Point any payments to the new holder
          if competition.using_payment_integrations?
            payment_intents = registration.payment_intents

            payment_intents.each do |payment_intent|
              payment_intent.update(holder: new_registration)
              root_record = payment_intent.payment_record

              # FIXME: This matching is running under the assumption that every record will be a StripeRecord.
              #   The probability that we launch PayPal before all V2 comps have been backported is non-existent.
              root_record.child_records.charge.each do |stripe_charge|
                ruby_money_charge = stripe_charge.money_amount

                reg_payment = new_registration.registration_payments.create!(
                  amount_lowest_denomination: ruby_money_charge.fractional,
                  currency_code: ruby_money_charge.currency.iso_code,
                  receipt: stripe_charge,
                  user: payment_intent.initiated_by,
                )

                stripe_charge.child_records.refund.each do |stripe_refund|
                  ruby_money_refund = stripe_refund.money_amount

                  new_registration.registration_payments.create!(
                    amount_lowest_denomination: ruby_money_refund.fractional.abs * -1,
                    currency_code: ruby_money_refund.currency.iso_code,
                    receipt: stripe_refund,
                    refunded_registration_payment_id: reg_payment.id,
                    user: payment_intent.initiated_by,
                  )
                end
              end
            end
          end

          ms_history = Microservices::Registrations.history_by_id(registration.attendee_id)
          ms_history['entries'].each do |entry|
            new_registration.add_history_entry(entry['changed_attributes'], entry['actor_type'], entry['actor_id'], entry['action'], entry['timestamp'])
          end
        end

        competition.registration_version_v3!
      end
    end
  end
end
