# frozen_string_literal: true

class CronjobStatistic < ApplicationRecord
  self.primary_key = "name"

  def in_progress?
    self.run_start.present? && self.run_end.blank?
  end

  def finished?
    self.run_end.present?
  end

  def scheduled?
    self.enqueued_at.present?
  end

  private def runner_class
    self.id.safe_constantize
  end

  def reason_not_to_run
    self.runner_class&.try(:reason_not_to_run)
  end

  # Aliases for easier access in JS frontend (which does not like question marks in object properties)
  alias_method :is_in_progress, :in_progress?
  alias_method :is_finished, :finished?
  alias_method :is_scheduled, :scheduled?

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[is_in_progress is_scheduled is_finished reason_not_to_run],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
