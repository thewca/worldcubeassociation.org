# frozen_string_literal: true
class Event < ActiveRecord::Base
  include Cachable
  self.table_name = "Events"

  has_many :competitions_events
  has_many :competitions, through: :competition_events
  has_many :registration_competition_events, through: :competition_events
  has_many :registrations, through: :registration_competition_events
  has_many :user_preferred_events
  has_many :users, through: :user_preferred_events
  has_many :preferred_formats
  has_many :formats, through: :preferred_formats

  default_scope -> { order(:rank) }

  def name
    I18n.t(id, scope: :events)
  end

  def name_in(locale)
    I18n.t(id, scope: :events, locale: locale)
  end

  def cellName
    fail "#cellName is deprecated, and will eventually be removed. Use #name instead. See https://github.com/thewca/worldcubeassociation.org/issues/1054."
  end

  scope :official, -> { where("rank < 990") }
  scope :deprecated, -> { where("rank between 990 and 999") }

  def recommended_format
    formats.recommended.first
  end

  def official?
    rank < 990
  end

  def deprecated?
    990 <= rank && rank < 1000
  end
end
