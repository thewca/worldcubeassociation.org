# frozen_string_literal: true
class RegistrationPayment < ActiveRecord::Base
  belongs_to :registration

  monetize :amount_lowest_denomination,
           as: "amount",
           allow_nil: true,
           with_model_currency: :currency_code
end
