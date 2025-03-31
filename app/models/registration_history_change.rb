# frozen_string_literal: true

class RegistrationHistoryChange < ApplicationRecord
  belongs_to :registration_history_entry
end
