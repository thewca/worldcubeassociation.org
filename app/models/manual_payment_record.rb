# frozen_string_literal: true

class ManualPaymentRecord < ApplicationRecord
  belongs_to :registration

  validates :registration_id, presence: true
  validates :payment_reference, presence: true
end
