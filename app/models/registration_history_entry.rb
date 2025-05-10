# frozen_string_literal: true

class RegistrationHistoryEntry < ApplicationRecord
  has_many :registration_history_changes, dependent: :destroy
  belongs_to :registration
end
