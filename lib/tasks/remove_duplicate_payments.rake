# frozen_string_literal: true

namespace :duplicate_payments do
  desc "Remove duplicate payment records from database"
  task destroy: :environment do
    duplicate_refund_stripe_ids = StripeRecord
                                  .group(:stripe_id)
                                  .having("COUNT(*) > 1")
                                  .count
                                  .keys

    puts "About to process #{duplicate_refund_stripe_ids}. Continue? [y/N]"
    proceed = $stdin.gets.chomp.downcase
    return unless proceed == 'y'

    negative_entry_fees = []

    duplicate_refund_stripe_ids.each do |id|
      puts "handling: #{id}"

      # First, get to the state where we have identified the webhook/non-webhook records
      records = StripeRecord.where(stripe_id: id)

      if records.count != 2
        puts "Expected 2 records but got #{records.count} - aborting"
        break
      end

      if records.first.parameters.blank?
        wh_record = records.first
        non_wh_record = records.last
      else
        wh_record = records.last
        non_wh_record = records.first
      end

      unless wh_record.present? && non_wh_record.present?
        puts "Stripe Records not defined as expect. wh_record: #{wh_record} | non_wh_record: #{non_wh_record} - aborting."
        break
      end

      if non_wh_record.registration_payment.blank?
        puts "No registration_payment present for non_wh_record: #{non_wh_record} - aborting."
        break
      end

      # Now we've identified the webhook/non-webhook records, we should:

      # 1. Associate the webhook events of the wh record to the non-wh record
      wh_record.stripe_webhook_events.each { it.update!(stripe_record: non_wh_record) }

      # 2. Destroy any registration_payment associated with the wh record
      wh_record.registration_payment&.destroy!

      # 3. Destroy the wh record
      wh_record.reload.destroy!

      # Check whether the registration now has a positive balance
      negative_entry_fees << non_wh_record.registration_id unless non_wh_record.registration.reload.paid_entry_fees >= 0
    end

    puts "Completed."
    puts "The following registrations still have negative paid entry fees - investigate: #{negative_entry_fees}" unless negative_entry_fees.empty?
  end
end
