# frozen_string_literal: true

class RegistrationHistoryEntry < ActiveRecord::Base
  has_many :registration_history_change, dependent: :destroy
  belongs_to :registration
end
