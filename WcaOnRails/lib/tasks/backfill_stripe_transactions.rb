# frozen_string_literal: true

@stripe_obj_cache = {}

def retrieve_stripe_obj(stripe_id, &block)
  @stripe_obj_cache[stripe_id] ||= block.call
end

def process_parameters_old(transaction)
  # Older transactions stored different metadata.
  arguments, account_details = transaction.parameters

  transaction.amount_stripe_denomination = arguments['amount']
  transaction.currency_code = arguments['currency']

  metadata = arguments['metadata']
  stripe_account_id = account_details['stripe_account']

  try_match_reg_payments(transaction, metadata, stripe_account_id)
end

def process_parameters_recent(transaction)
  metadata = transaction.parameters['metadata']

  # newer Stripe Charges don't store their account ID in our manual metadata anymore (somebody changed the format at some point)
  # so we have to resort to the competition instead and hope that it still has a Stripe account attached.
  competition_name = metadata['competition']
  competition = Competition.find_by(name: competition_name)

  stripe_account_id = competition&.connected_stripe_account_id

  return puts "Cannot re-construct Stripe account ID for transaction ##{transaction.id}. Skipping…" if stripe_account_id.nil?

  try_match_reg_payments(transaction, metadata, stripe_account_id)
end

def try_match_reg_payments(transaction, metadata, stripe_account_id)
  wca_id = metadata[:wca_id]
  competition_name = metadata[:competition]

  person = Person.find_by(wca_id: wca_id)
  competition = Competition.find_by(name: competition_name)

  if person && competition
    registration = Registration.find_by(competition_id: competition.id, user_id: person.user.id)

    comp_stripe_account = competition.connected_stripe_account_id

    if comp_stripe_account.nil?
      puts "WARNING: There is no Stripe account associated with #{competition.id} anymore."
    elsif comp_stripe_account != stripe_account_id
      puts "WARNING: The competition's Stripe account (#{comp_stripe_account}) is different from the metadata's Stripe account (#{account_details[:stripe_account]})."
    end

    # We run into this loop if a StripeTransaction was NOT able to match the RegistrationPayment based on the stripe_id alone.
    # This most likely happens because we have historical records where the stripe_id column in the transactions table is set to 0 or NULL.
    registration.registration_payments.each do |rev_eng_payment|
      payment_stripe_id = rev_eng_payment.stripe_charge_id

      if payment_stripe_id.present?
        is_charge_payment = payment_stripe_id.start_with?('ch_')
        is_refund_payment = payment_stripe_id.start_with?('re_')

        if is_charge_payment
          stripe_obj = retrieve_stripe_obj(payment_stripe_id) { Stripe::Charge.retrieve(payment_stripe_id, stripe_account_id) }
        elsif is_refund_payment
          stripe_obj = retrieve_stripe_obj(payment_stripe_id) { Stripe::Refund.retrieve(payment_stripe_id, stripe_account_id) }
        else
          puts "The stripe_charge_id for registration payment ##{rev_eng_payment.id} has an unknown prefix type: #{payment_stripe_id}. Skipping…"
          next
        end

        # Historical records did not use the Ruby<->Stripe conversion routine (because that was only recently added)
        # so we can compare the amounts directly without worrying about denominations. We only have to worry about negative amounts for refund
        rev_eng_stripe_amount = rev_eng_payment.amount_lowest_denomination.abs * (is_refund_payment ? -1 : 1)

        if stripe_obj.amount == rev_eng_stripe_amount && stripe_obj.currency.lower == rev_eng_payment.currency_code.lower
          # It's a match!
          transaction.stripe_id = payment_stripe_id
          transaction.account_id = stripe_account_id

          transaction.amount_stripe_denomination = stripe_obj.amount
          transaction.currency_code = stripe_obj.currency

          # Store the receipt
          rev_eng_payment.receipt = transaction
          rev_eng_payment.save(validation: false)
        end
      else
        puts "The registration payment ##{rev_eng_payment.id} does not have an attached Stripe charge ID"
      end
    end
  else
    puts "Competition named '#{competition_name}' not found" if competition.nil?
    puts "Person '#{wca_id}' not found" if person.nil?
  end
end

namespace :stripe_transactions do
  desc "Fill in the new columns for old charges that have already been recorded in the system"
  task backfill_registrations: [:environment] do
    StripeTransaction.find_each do |transaction|
      if transaction.stripe_charge_id.present? && transaction.stripe_charge_id != 0
        unless transaction.registration_payment.present?
          reg_payment = RegistrationPayment.find_by(stripe_charge_id: transaction.stripe_charge_id)

          if reg_payment.present?
            reg_payment.receipt = transaction
            # We need to run this without validations because there are some _very_ old Stripe transactions in our system,
            # that didn't even record a `user_id` (because it was not part of the table structure back then). This makes
            # Rails freak out because nowadays, upon saving, user_id is required.
            reg_payment.save(validate: false)
          else
            puts "Stripe transaction without matching RegistrationPayment: #{transaction.stripe_charge_id}"
          end
        end
      elsif transaction.parameters.is_a? Array
        process_parameters_old(transaction)
      elsif transaction.parameters.is_a? Hash
        # Newer transactions store the Stripe API args directly as metadata.
        process_parameters_recent(transaction)
      end

      if transaction.stripe_id&.start_with?('pi_')
        transaction.api_type = 'payment_intent'
      elsif transaction.stripe_id&.start_with?('ch_')
        transaction.api_type = 'charge'
      elsif transaction.stripe_id&.start_with?('re_')
        transaction.api_type = 'refund'
      end

      transaction.save
    end
  end
end
