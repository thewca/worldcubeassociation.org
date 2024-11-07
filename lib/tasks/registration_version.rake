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
          registration.add_history_entry(registration.attributes.to_h, "rake task", "WST", "V2 Migration")
        end

        competition.update_column :registration_version, :v3
      end
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

    LogTask.log_task("Migrating Registrations for Competition #{competition_id}") do
      ActiveRecord::Base.transaction do
        competition.microservice_registrations.each do |registration|
          new_registration = Registration.create(competition_id: competition_id,
                                                 user_id: registration.user_id,
                                                 comments: registration.comments,
                                                 guests: registration.guests,
                                                 competing_status: registration.competing_status,
                                                 administrative_notes: registration.administrative_notes,
                                                 registration_competition_events: registration.event_ids.map do |event_id|
                                                   RegistrationCompetitionEvent.create(competition_event: competition.competition_events.find { |ce| ce.event_id == event_id })
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

                reg_payment = new_registration.registration_payments.create(
                  amount_lowest_denomination: ruby_money_charge.fractional,
                  currency_code: ruby_money_charge.currency.iso_code,
                  receipt: stripe_charge,
                  user_id: payment_intent.initiated_by,
                )

                stripe_charge.child_records.refund.each do |stripe_refund|
                  ruby_money_refund = stripe_refund.money_amount

                  new_registration.registration_payments.create(
                    amount_lowest_denomination: ruby_money_refund.fractional.abs * -1,
                    currency_code: ruby_money_refund.currency.iso_code,
                    receipt: stripe_refund,
                    refunded_registration_payment_id: reg_payment.id,
                    user_id: payment_intent.initiated_by,
                  )
                end
              end
            end
          end

          new_registration.save!

          ms_history = Microservices::Registrations.history_by_id(registration.attendee_id)
          ms_history['entries'].each do |entry|
            new_registration.add_history_entry(entry['changed_attributes'], entry['actor_type'], entry['actor_id'], entry['action'], entry['timestamp'])
          end
        end

        competition.update_column :registration_version, :v3
      end
    end
  end
end
