# frozen_string_literal: true

class RegistrationHistoryChange < ActiveRecord::Base
  belongs_to :registration_history_entry
end
