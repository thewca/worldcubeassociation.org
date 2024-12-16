# frozen_string_literal: true

class RegistrationHistoryEntry < ActiveRecord::Base
  has_many :registration_history_changes, dependent: :destroy
  belongs_to :registration
end
