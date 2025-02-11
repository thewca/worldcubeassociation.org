# frozen_string_literal: true

class LiveRecord < ApplicationRecord
  RECORD_SCOPES = %w[WR CR NR].freeze
  RECORD_TYPES = %w[single average].freeze

  validates :record_type, presence: true, inclusion: { in: RECORD_TYPES }
  validates :record_scope, presence: true, inclusion: { in: RECORD_SCOPES }
  validates :event_id, presence: true
  validates :value, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :country_id, presence: true, if: -> { record_scope == 'NR' }
  validates :continent_id, presence: true, if: -> { record_scope == 'CR' }

  scope :world_records, -> { where(record_scope: 'WR') }
  scope :continental_records, -> { where(record_scope: 'CR') }
  scope :national_records, -> { where(record_scope: 'NR') }

  def self.best_for(event_id, record_type, scope, country_id: nil, continent_id: nil)
    query = where(event_id: event_id, record_type: record_type, record_scope: scope)
    query = query.where(country_id: country_id) if country_id
    query = query.where(continent_id: continent_id) if continent_id
    query.minimum(:value)
  end
end
