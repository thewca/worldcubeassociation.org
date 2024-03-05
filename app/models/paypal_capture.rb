# frozen_string_literal: true

class PaypalCapture < ApplicationRecord
  belongs_to :paypal_transaction
end
