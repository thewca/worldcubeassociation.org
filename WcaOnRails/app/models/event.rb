# frozen_string_literal: true

class Event < ApplicationRecord
  include Cachable

  has_many :competition_events
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

  def cell_name
    raise "#cell_name is deprecated, and will eventually be removed. Use #name instead. See https://github.com/thewca/worldcubeassociation.org/issues/1054."
  end

  # 'rank' is a reserved keywords from MySQL 8.0 onwards:
  # https://dev.mysql.com/doc/refman/8.0/en/keywords.html#keywords-8-0-detailed-R
  # Therefore we need to quote it in the query.
  scope :official, -> { where("`rank` < 990") }
  scope :deprecated, -> { where("`rank` between 990 and 999") }

  def recommended_format
    formats.recommended.first
  end

  def official?
    rank < 990
  end

  def deprecated?
    990 <= rank && rank < 1000
  end

  # See https://www.worldcubeassociation.org/regulations/#9f12
  def timed_event?
    !fewest_moves? && !multiple_blindfolded?
  end

  def fewest_moves?
    self.id == "333fm"
  end

  def multiple_blindfolded?
    self.id == "333mbf" || self.id == "333mbo"
  end

  def can_change_time_limit?
    !fewest_moves? && !multiple_blindfolded?
  end

  def can_have_cutoff?
    self.id != "333bf" && self.id != "444bf" && self.id != "555bf"
  end

  # Events that are generally fast enough to never need to go over the default 10 minute time limit
  def fast_event?
    ['333', '222', '444', '333oh', 'clock', 'mega', 'pyram', 'skewb', 'sq1'].include?(self.id)
  end

  alias_method :can_change_time_limit, :can_change_time_limit?
  alias_method :can_have_cutoff, :can_have_cutoff?
  alias_method :is_timed_event, :timed_event?
  alias_method :is_fewest_moves, :fewest_moves?
  alias_method :is_multiple_blindfolded, :multiple_blindfolded?

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id"],
    methods: ["name", "can_change_time_limit", "can_have_cutoff", "is_timed_event",
              "is_fewest_moves", "is_multiple_blindfolded", "format_ids"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
