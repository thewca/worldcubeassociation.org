# frozen_string_literal: true

# rubocop:disable Metrics/ParameterLists
class RegionalRecord < ApplicationRecord
  enum :record_scope, {
    national: 0,
    continental: 1,
    world: 2,
  }, prefix: true

  enum :record_type, { single: 'single', average: 'average' }, prefix: true

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

  # rubocop:disable Style/PredicateMethod
  # this returns a boolean + the marker so this is still a predicate method
  def self.record_at_date?(value, event_id, record_type, country_id, timestamp)
    scope_filter = arel_table[:record_scope]
    continent_id = Country.c_find(country_id).continent_id

    records = RegionalRecord.where(event_id: event_id, record_type: record_type)
                            .where(record_scope: %i[world continental national])
                            .where(record_timestamp: ..timestamp)
                            .where(
                              scope_filter.eq(:world)
                                          .or(scope_filter.eq(:continental).and(arel_table[:continent_id].eq(continent_id)))
                                          .or(scope_filter.eq(:national).and(arel_table[:country_id].eq(country_id))),
                            )
                            .group(:record_scope)
                            .minimum(:value)

    return [true, "WR"] if records["world"] && value <= records["world"]
    return [true, Continent.c_find(continent_id).record_name] if records["continental"] && value <= records["continental"]
    return [true, "NR"] if records["national"] && value <= records["national"]

    [false, nil]
  end
  # rubocop:enable Style/PredicateMethod

  def self.build_threshold_series(event_ids, value_name)
    # Fetch all relevant records once
    recs = RegionalRecord
           .where(record_type: value_name,
                  event_id: event_ids,
                  record_scope: %w[world continental national])
           .order(:event_id, :record_timestamp, :record_scope, :continent_id, :country_id)
           .pluck(
             :event_id,
             :record_timestamp,
             :record_scope,
             :continent_id,
             :country_id,
             :value,
           )

    world_series        = Hash.new { |h, event| h[event] = [] }
    continental_series  = Hash.new { |h, k|  h[k]     = [] }  # key = [event, continent]
    national_series     = Hash.new { |h, k|  h[k]     = [] }  # key = [event, country]

    recs.each do |event_id, ts, scope, continent, country, val|
      case scope
      when "world"
        arr = world_series[event_id]
        arr << [ts, arr.empty? ? val : [arr.last.last, val].min]

      when "continental"
        key = [event_id, continent]
        arr = continental_series[key]
        arr << [ts, arr.empty? ? val : [arr.last.last, val].min]

      when "national"
        key = [event_id, country]
        arr = national_series[key]
        arr << [ts, arr.empty? ? val : [arr.last.last, val].min]
      end
    end

    [world_series, continental_series, national_series]
  end

  def self.lookup_threshold(arr, target_ts)
    return nil if arr.empty?

    i = arr.bsearch_index { |ts, _| ts > target_ts }
    return arr.last.last if i.nil?   # everything ≤ target_ts
    return nil if i.zero?            # no entries ≤ target_ts

    arr[i - 1].last
  end

  def self.annotate_candidates(best_at_date, value_name)
    event_ids = best_at_date.pluck(1).uniq
    w_series, c_series, n_series = build_threshold_series(event_ids, value_name)

    results_by_id = Result.includes(:competition)
                          .where(id: best_at_date.map(&:first))
                          .index_by(&:id)

    best_at_date.filter_map do |result_id, event_id, country_id, continent_id, min_val, ts|
      # fetch from each series
      w_cutoff = lookup_threshold(w_series[event_id],                  ts)
      c_cutoff = lookup_threshold(c_series[[event_id, continent_id]],  ts)
      n_cutoff = lookup_threshold(n_series[[event_id, country_id]],    ts)

      marker =
        if !w_cutoff || min_val <= w_cutoff
          "WR"
        elsif !c_cutoff || min_val <= c_cutoff
          Continent.c_find(continent_id).record_name
        elsif !n_cutoff || min_val <= n_cutoff
          "NR"
        end

      next unless marker

      r = results_by_id[result_id]
      {
        computed_marker: marker,
        competition: r.competition,
        result: r,
      }
    end
  end

  def marker
    case record_scope
    when :world
      "WR"
    when :continental
      Continent.c_find(continent_id).record_name
    when :national
      "NR"
    end
  end
end

# rubocop:enable Metrics/ParameterLists
