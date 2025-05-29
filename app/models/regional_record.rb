# frozen_string_literal: true

class RegionalRecord < ApplicationRecord
  enum :record_scope, {
    national: 0,
    continental: 1,
    world: 2,
  }, prefix: true

  RECORD_TYPES = %w[single average].freeze

  validates :record_type, presence: true, inclusion: { in: RECORD_TYPES }
  validates :event_id, presence: true
  validates :record_timestamp, presence: true
  validates :value, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :country_id, presence: true, if: -> { record_scope == :national }
  validates :continent_id, presence: true, if: -> { record_scope == :continental }

  scope :world_records, -> { where(record_scope: :world) }
  scope :national_records, lambda { |country_id = nil|
    scope = where(record_scope: :national)
    country_id.present? ? scope.where(country_id: country_id) : scope
  }

  scope :continental_records, lambda { |continent_id = nil|
    scope = where(record_scope: :continental)
    continent_id.present? ? scope.where(continent_id: continent_id) : scope
  }

  scope :current, lambda {
    latest = select("event_id, record_type, MAX(record_timestamp) as latest_time")
             .group(:event_id, :record_type)

    joins("INNER JOIN (#{latest.to_sql}) latest_records
         ON regional_records.event_id = latest_records.event_id
         AND regional_records.record_type = latest_records.record_type
         AND regional_records.record_timestamp = latest_records.latest_time")
  }

  belongs_to :result

  def self.record_for(event_id, record_type, scope, country_id: nil, continent_id: nil, date: nil)
    query = where(event_id: event_id, record_type: record_type, record_scope: scope)
    query = query.where(country_id: country_id) if country_id
    query = query.where(continent_id: continent_id) if continent_id
    query = query.where(record_timestamp: ..date) if date
    query.minimum(:value)
  end

  # To make this into a single query, we will need to store duplicates of every NR, WR, CR
  # then we can do something like
  # records = RegionalRecord.where(event_id: event_id, record_type: record_type)
  #                           .where(record_scope: [:WR, :CR, :NR])
  #                           .where(record_timestamp: ..timestamp)
  #                           .where(
  #                             scope_filter.eq(:WR)
  #                             .or(scope_filter.eq(:CR).and(arel_table[:continent_id].eq(continent_id)))
  #                             .or(scope_filter.eq(:NR).and(arel_table[:country_id].eq(country_id)))
  #                           )
  #                           .group(:record_scope)
  #                           .minimum(:value)
  # Not sure if worth it right now
  def self.is_record_at_date?(value, event_id, record_type, country_id, timestamp)
    return [true, "WR"] if record_for(event_id, record_type, :WR, date: timestamp) >= value

    country = Country.c_find(country_id)
    return [true, CONTINENT_TO_RECORD_MARKER[country.continent_id]] if record_for(event_id, record_type, :CR, continent_id: country.continent_id, date: timestamp) >= value

    return [true, "NR"] if record_for(event_id, record_type, :NR, country_id: country_id, date: timestamp) >= value

    [false, nil]
  end

  CONTINENT_TO_RECORD_MARKER = {
    '_Africa' => 'AfR',
    '_Europe' => 'ER',
    '_North America' => 'NAR',
    '_South America' => 'SAR',
    '_Asia' => 'AsR',
    '_Oceania' => 'OcR',
  }.freeze

  def marker
    case record_scope
    when :continental
      CONTINENT_TO_RECORD_MARKER[continent_id]
    when :world
      "WR"
    when :national
      "NR"
    end
  end
end
