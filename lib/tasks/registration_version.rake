# frozen_string_literal: true

# Quick snippet to remove the "wcaRegistrationId" from the WCIF
# This field directly points to our internal DB, so of course it will change.
def clean_wcif_registrations(wcif)
  clean_persons = wcif["persons"].map do |person|
    reg = person["registration"]
    clean_registration = reg&.except("wcaRegistrationId")

    person.merge(
      "registration" => clean_registration,
    )
  end

  wcif.merge(
    "persons" => clean_persons,
  )
end

namespace :registration_version do
  desc "Migrates a Competition from V1 to V3"
  task :migrate_v1_v3, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    abort "Competition id is required" if competition_id.blank?

    competition = Competition.find(competition_id)

    abort "Competition #{competition_id} not found" if competition.nil?

    abort "Competition #{competition_id} is not on version 1" unless competition.registration_version_v1?

    LogTask.log_task("Migrating Registrations for Competition #{competition_id}") do
      ActiveRecord::Base.transaction do
        competition.registrations.includes(:registration_payments, :registration_history_entries).find_each do |registration|
          registration.update_column :competing_status, registration.compute_competing_status
          if registration.paid_entry_fees.positive?
            registration.registration_payments.each do |payment|
              # If the payments were made after November 6th we already have history entries for it
              registration.add_history_entry({ payment_status: payment.payment_status, iso_amount: payment.amount_lowest_denomination }, "user", payment.user_id, "V2 Migration", payment.created_at) if payment.created_at < Time.new(2024, 11, 6)
            end
          end

          registration.add_history_entry({ competing_status: 'accepted' }, "user", registration.accepted_by, "V2 Migration", registration.accepted_at) if registration.accepted_at.present?

          registration.add_history_entry({ competing_status: 'cancelled' }, "user", registration.deleted_by, "V2 Migration", registration.deleted_at) if registration.deleted_at.present?

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

  desc "Migrate v2 microservice registrations to v3 integrated registrations"
  task :migrate_v2_v3, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    abort "Competition id is required" if competition_id.blank?

    competition = Competition.includes(:competition_events).find(competition_id)

    abort "Competition #{competition_id} not found" if competition.nil?

    abort "Competition #{competition_id} is not on version 2" unless competition.registration_version_v2?

    LogTask.log_task("Migrating Registrations for Competition #{competition_id}") do
      wcif_v2 = competition.to_wcif(authorized: true)
      wcif_v2 = clean_wcif_registrations(wcif_v2)

      ActiveRecord::Base.transaction do
        competition.microservice_registrations.wcif_ordered.includes(:payment_intents).find_each do |registration|
          puts "Creating registration for user: #{registration.user_id}"
          new_registration = Registration.build(
            competition_id: competition_id,
            user_id: registration.user_id,
            comments: registration.comments,
            guests: registration.guests,
            competing_status: registration.competing_status,
            administrative_notes: registration.administrative_notes,
            roles: registration.roles,
            is_competing: registration.is_competing?,
          ) do |reg|
            puts "Microservice reports (#{registration.event_ids.count}) event_ids: #{registration.event_ids.inspect}"

            registered_events = competition.competition_events.where(event_id: registration.event_ids)
            rce_init_data = registered_events.map { |ce| { competition_event: ce } }

            puts "Monolith found (#{rce_init_data.count}) matching competition events: #{registered_events.ids.inspect}"
            reg.registration_competition_events.build(rce_init_data)
          end

          puts "Registration built: #{new_registration.inspect}"
          new_registration.save!

          next unless registration.is_competing? # We don't need to migrate history or payments for non-competing registrations

          # Point any payments to the new holder
          if competition.using_payment_integrations?
            payment_intents = registration.payment_intents

            payment_intents.each do |payment_intent|
              payment_intent.update!(holder: new_registration)
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

          # Migrate assignments
          registration.assignments.each do |assignment|
            assignment.update!(registration: new_registration)
          end

          # Migrate WCIF extensions
          registration.wcif_extensions.each do |wcif_extension|
            wcif_extension.update!(extendable: new_registration)
          end

          # Migrate History
          ms_history = Microservices::Registrations.history_by_id(registration.attendee_id)
          ms_history['entries'].each do |entry|
            new_registration.add_history_entry(entry['changed_attributes'], entry['actor_type'], entry['actor_id'], entry['action'], entry['timestamp'])
          end
        end

        # Migrate Waiting List
        waitlisted_competitors = competition.registrations.waitlisted
        ms_waiting_list = Microservices::Registrations.waiting_list_by_id(competition_id)
        reg_lookup = waitlisted_competitors.pluck(:user_id, :id).to_h
        competition.create_waiting_list(entries: ms_waiting_list.map { |user_id| reg_lookup[user_id] })

        competition.registration_version_v3!

        wcif_v3 = competition.reload.to_wcif(authorized: true)
        wcif_v3 = clean_wcif_registrations(wcif_v3)

        unless wcif_v2 == wcif_v3
          puts wcif_v2.to_json
          puts wcif_v3.to_json

          raise "The WCIF output did not match. Logging debug details: First WCIF is v2, second WCIF is v3"
        end

        puts "WCIF sanity check has completed succesfully. Continuing migration"
      end
    end
  end

  task backport_timestamps: [:environment] do
    v3_competitions_ids = Competition.registration_version_v3.pluck(:id).to_set

    Registration.includes(:registration_history_entries)
                .where(deleted_at: nil)
                .where(accepted_at: nil)
                .where(created_at: 2.weeks.ago..)
                .find_each do |registration|
                  if v3_competitions_ids.include?(registration.competition_id)
                    registration.recompute_timestamps

                    earliest_registration_action = registration.registration_history_entries.minimum(:created_at)
                    registration.created_at = earliest_registration_action

                    registration.save!
                  end
    end
  end

  task cleanup_payments: [:environment] do
    RegistrationPayment.joins(registration: :competition)
                       .merge(Competition.registration_version_v3)
                       .find_each do |reg_payment|
                         # Cannot eagerly preload these because of polymorphic association :/
                         receipt = reg_payment.receipt
                         next unless receipt.is_a? StripeRecord

                         # The method `succeeded?` is defined through the scope `stripe_status` on the AR model
                         receipt_invalid = !reg_payment.receipt.succeeded?

                         # The `destroy` method takes all refunded RegPayments to the grave as well
                         #   through the `dependent: destroy` on the `has_many` association
                         reg_payment.destroy if receipt_invalid
    end
  end
end
