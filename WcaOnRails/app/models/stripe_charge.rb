# frozen_string_literal: true

class StripeCharge < ApplicationRecord
  enum status: {
    unknown: "unknown",
    success: "success",
    failure: "failure",
  }
end
