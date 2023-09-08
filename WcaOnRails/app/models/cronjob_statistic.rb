# frozen_string_literal: true

class CronjobStatistic < ApplicationRecord
  def in_progress?
    self.run_start.present? && !self.run_end.present?
  end

  def finished?
    self.run_end.present?
  end

  def scheduled?
    self.enqueued_at.present?
  end
end
