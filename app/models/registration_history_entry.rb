# frozen_string_literal: true

require 'time'

class RegistrationHistoryEntry < ActiveRecord::Base
  has_many :registration_history_change, :dependent => :destroy
end
