# frozen_string_literal: true

class Record < ApplicationRecord
  RECORD_SCOPES = %w[WR CR NR].freeze
  RECORD_TYPES = %w[single average].freeze

  SCOPES_FOR = {
    NR: %w[WR CR NR].freeze,
    CR: %w[WR CR].freeze,
    WR: %w[WR].freeze,
  }.freeze

  validates :record_type, presence: true, inclusion: { in: RECORD_TYPES }
  validates :record_scope, presence: true, inclusion: { in: RECORD_SCOPES }
  validates :event_id, presence: true
  validates :record_timestamp, presence: true
  validates :value, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :country_id, presence: true, if: -> { record_scope == 'NR' }
  validates :continent_id, presence: true, if: -> { record_scope == 'CR' }

  scope :world_records, -> { where(record_scope: 'WR') }
  scope :national_records, lambda { |country_id = nil|
    scope = where(record_scope: 'NR')
    country_id.present? ? scope.where(country_id: country_id) : scope
  }

  scope :continental_records, lambda { |continent_id = nil|
    scope = where(record_scope: 'CR')
    continent_id.present? ? scope.where(continent_id: continent_id) : scope
  }

  scope :current, lambda {
    latest = select("event_id, record_type, MAX(record_timestamp) as latest_time")
             .group(:event_id, :record_type)

    joins("INNER JOIN (#{latest.to_sql}) latest_records
         ON records.event_id = latest_records.event_id
         AND records.record_type = latest_records.record_type
         AND records.record_timestamp = latest_records.latest_time")
  }

  belongs_to :result

  def self.record_for(event_id, record_type, scope, country_id: nil, continent_id: nil, date: nil)
    query = where(event_id: event_id, record_type: record_type, record_scope: SCOPES_FOR[scope])
    query = query.where(country_id: country_id) if country_id
    query = query.where(continent_id: continent_id) if continent_id
    query = query.where(record_timestamp: ...date) if date
    query.minimum(:value)
  end

  CONTINENT_TO_RECORD_MARKER = {
    '_Africa' => 'AfR',
    '_Europe' => 'ER',
    '_North_America' => 'NAR',
    '_South America' => 'SAR',
    '_Asia' => 'AsR',
    '_Oceania' => 'OcR',
  }.freeze

  def marker
    return 'NR' if record_scope == 'NR'
    return CONTINENT_TO_RECORD_MARKER[continent_id] if record_scope == 'CR'

    'WR'
  end
end
