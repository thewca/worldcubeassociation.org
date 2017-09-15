# frozen_string_literal: true

class Incident < ApplicationRecord
  # Note: *always* insert a new status at the end of the array
  # 0 (:pending) is the default (see db schema).
  enum status: [:pending, :solved, :solved_awaiting_digest, :solved_digest_sent]

  has_many :incident_tags, autosave: true, dependent: :destroy
  has_many :incident_competitions, dependent: :destroy
  has_many :competitions, through: :incident_competitions

  accepts_nested_attributes_for :incident_competitions, allow_destroy: true

  include Taggable

  def resolved?
    status == "solved" || status == "solved_awaiting_digest" || "solved_digest_sent"
  end
end
