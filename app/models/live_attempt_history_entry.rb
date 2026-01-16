# frozen_string_literal: true

class LiveAttemptHistoryEntry < ApplicationRecord
  belongs_to :live_attempt

  validates :entered_at, presence: true
  validates :entered_by, presence: true
  validates :value, presence: true
end
