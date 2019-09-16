# frozen_string_literal: true

class StripeCharge < ApplicationRecord
  enum status: {
    unknown: "unknown",
    payment_intent_registered: "payment_intent_registered",
    success: "success",
    failure: "failure",
  }
end
