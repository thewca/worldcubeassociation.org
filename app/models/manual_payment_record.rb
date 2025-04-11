# frozen_string_literal: true

class ManualPaymentRecord < ApplicationRecord
  belongs_to :registration

  validates :payment_reference, presence: true
end
