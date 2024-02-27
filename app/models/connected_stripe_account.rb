# frozen_string_literal: true

class ConnectedStripeAccount < ApplicationRecord
  has_one :competition_payment_integration, as: :connected_account
end
