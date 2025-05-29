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

  def self.is_record_at_date?(value, event_id, record_type, country_id, continent_id, timestamp)
    scope_filter = arel_table[:record_scope]

    records = RegionalRecord.where(event_id: event_id, record_type: record_type)
                            .where(record_scope: [:world, :continental, :national])
                            .where(record_timestamp: ..timestamp)
                            .where(
                              scope_filter.eq(:world)
                                          .or(scope_filter.eq(:continental).and(arel_table[:continent_id].eq(continent_id)))
                                          .or(scope_filter.eq(:national).and(arel_table[:country_id].eq(country_id)))
                            )
                            .group(:record_scope)
                            .minimum(:value)

    return [true, "WR"] if records["world"] && value <= records["world"]
    return [true, CONTINENT_TO_RECORD_MARKER[continent_id]] if records["continental"] && value <= records["continental"]
    return [true, "NR"] if records["national"] && value <= records["national"]
    [false, nil]
  end

  def self.collect_record_thresholds(best_at_date, value_name)
    # 1) Extract the distinct keys we’ll need
    combos = best_at_date.map { |_, event_id, country_id, continent_id, _, timestamp|
      [ event_id, country_id, continent_id, timestamp ]
    }.uniq

    # 2) Unzip into nicer lookup sets
    event_ids, country_ids, continent_ids, timestamps = combos.transpose.map(&:uniq)

    # 3) One big grouped minimum query
    #   We group by all four dimensions plus the record_scope
    minima = RegionalRecord
               .where(record_type: value_name,
                      event_id:        event_ids,
                      record_scope:    %w[world continental national],
                      country_id: country_ids,
                      continent_id: continent_ids)
               .where(record_timestamp: timestamps.min..timestamps.max)
               .group(:event_id, :record_timestamp, :record_scope, :continent_id, :country_id)
               .minimum(:value)

    # 4) Build a nested lookup hash
    thresholds = Hash.new { |h, k| h[k] = {} }
    minima.each do |(event_id, ts, scope, continent, country), min_value|
      thresholds[[ event_id, country, continent, ts ]] ||= {}
      thresholds[[ event_id, country, continent, ts ]][scope] = min_value
    end

    thresholds
  end

  def self.annotate_candidates(best_at_date, value_name)
    # Precompute the thresholds table
    thresholds = collect_record_thresholds(best_at_date, value_name)

    # Pull all the Result objects in one go
    result_ids = best_at_date.map(&:first)
    results_by_id = Result.includes(:competition)
                          .where(id: result_ids)
                          .index_by(&:id)

    # Now do a single pass
    best_at_date.filter_map do |result_id, event_id, country_id, continent_id, min_value, ts|
      t = thresholds[[ event_id, country_id, continent_id, ts ]] || {}
      marker =
        if t["world"] && min_value <= t["world"]
          "WR"
        elsif t["continental"] && min_value <= t["continental"]
          CONTINENT_TO_RECORD_MARKER[continent_id]
        elsif t["national"]  && min_value <= t["national"]
          "NR"
        end

      next unless marker

      result = results_by_id[result_id]
      {
        computed_marker: marker,
        competition:     result.competition,
        result:          result
      }
    end
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
