# frozen_string_literal: true

namespace :migration_utilities do
  desc "Links all registration payments to payment intents where possible"
  task link_registration_payments: [:environment] do
    RegistrationPayment.includes(receipt: { parent_record: :payment_intent }).find_each do |reg_pmt|
      payment_intent = reg_pmt.receipt&.parent_record&.payment_intent
      reg_pmt.update!(payment_intent: payment_intent) unless payment_intent.nil?
    end
  end
end
