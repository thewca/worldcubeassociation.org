# frozen_string_literal: true
module RegistrationsHelper
  def fees_hint_and_context(connected_stripe_account_id, fees_to_pay)
    if connected_stripe_account_id
      if fees_to_pay <= 0
        [t('registrations.entry_fees_fully_paid', paid: paid_entry_fees), "success"]
      else
        [t('registrations.will_pay_here'), "info"]
      end
    else
      [t('registrations.wont_pay_here'), "info"]
    end
  end
end
