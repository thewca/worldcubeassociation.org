# frozen_string_literal: true

class Incident < ApplicationRecord
  has_many :incident_tags, autosave: true, dependent: :destroy
  has_many :incident_competitions, dependent: :destroy
  has_many :competitions, -> { order("Competitions.start_date asc") }, through: :incident_competitions

  accepts_nested_attributes_for :incident_competitions, allow_destroy: true

  scope :resolved, -> { where.not(resolved_at: nil) }

  validate :digest_sent_at_consistent
  validates_presence_of :title

  include Taggable

  def last_happened_date
    competitions.last&.start_date || created_at.to_date
  end

  def digest_missing?
    digest_worthy && !digest_sent_at
  end

  def digest_sent?
    digest_sent_at != nil
  end

  def resolved?
    resolved_at != nil
  end

  def digest_sent_at_consistent
    if digest_sent_at && !digest_worthy
      errors.add(:digest_sent_at, "can't be set if digest_worthy is false.")
    end
    if digest_sent_at && !resolved_at
      errors.add(:digest_sent_at, "can't be set if incident is not resolved.")
    end
  end
end
