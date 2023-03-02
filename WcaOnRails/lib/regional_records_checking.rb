# frozen_string_literal: true

module RegionalRecordsChecking
  # as of 3-2023, the amount of competitions happening within 3 months can comfortably fit into memory.
  CHECK_RECORDS_INTERVAL = 3.months
  REGION_WORLD = '__World'

  def self.find_by_interval(interval_duration, scope = Competition, &block)
    iter_start_date = scope.minimum(:start_date)

    until iter_start_date.nil?
      iter_end_date = iter_start_date + interval_duration

      # Cannot use Rails' hyper-efficient `find_each` because it doesn't allow ORDER BY clauses.
      # The entire purpose of this method is essentially to replicate find_each with our custom ordering.
      scope.where("start_date >= ?", iter_start_date)
           .where("start_date < ?", iter_end_date)
           .each(&block)

      iter_start_date = scope.where("start_date >= ?", iter_end_date)
                             .minimum(:start_date)
    end
  end

  def self.competition_scope(event_id, competition_id)
    # Ordering by start_date is _crucial_ as we're checking results over time.
    # A competition that starts later has the potential to set a new record.
    # Ordering by competition ID is pure cosmetics and useful for consistency in debugging.
    competition_scope = Competition.order("start_date, id")

    if event_id.present?
      # If there's an event_id, care only for competitions that hold the event in question.
      # Quirk: If there are Results in the SQL tables with the desired event_id but with a
      #   competition_id that has no associated competition_event with that event_id,
      #   those Results won't be considered.
      competition_scope = competition_scope.joins(:competition_events)
                                           .where(competition_events: { event_id: event_id })
    end

    if competition_id.present?
      # Load the competition (complains via ActiveRecord if an invalid ID was used)
      model_competition = Competition.find(competition_id)

      # Use all competitions up to _and including_ the end date of the desired competition
      # because otherwise we would exclude the chosen competition itself
      competition_scope = competition_scope.where('end_date <= ?', model_competition.end_date)
    end

    competition_scope
  end

  def self.results_scope(competition, event_id, value_column)
    results_scope = competition.results

    if event_id.present?
      results_scope = results_scope.where(event_id: event_id)
    end

    # Ordering by RoundType is _crucial_ because the `rank` property encodes information
    # about the temporal sequence of rounds (i.e. a Final has a higher `rank` than
    #   a First Round because a Final comes after the First Round in a schedule.)
    # Ordering by the actual value is also _crucial_, because we mark records eagerly,
    #   i.e. as soon as a faster result is found it is immediately marked, without checking
    #   whether an _even faster_ result occured in the same round.
    results_scope.joins(:round_type)
                 .order("RoundTypes.rank, #{value_column}")
  end

  def self.compute_record_marker(event_records, result, wca_value)
    computed_marker = nil

    if !event_records.key?(result.country_id) || wca_value <= event_records[result.country_id]
      computed_marker = 'NR'
      event_records[result.country_id] = wca_value

      if !event_records.key?(result.continent_id) || wca_value <= event_records[result.continent_id]
        continental_record_name = result.continent.record_name
        computed_marker = continental_record_name

        event_records[result.continent_id] = wca_value

        if !event_records.key?(REGION_WORLD) || wca_value <= event_records[REGION_WORLD]
          computed_marker = 'WR'
          event_records[REGION_WORLD] = wca_value
        end
      end
    end

    [computed_marker, event_records]
  end

  def self.relevant_result(event_id, competition_id, result, computed_marker, stored_marker)
    if event_id.present? && competition_id.present?
      result.event_id == event_id && result.competition_id == competition_id
    elsif event_id.present?
      result.event_id == event_id
    elsif competition_id.present?
      result.competition_id == competition_id
    else
      computed_marker != stored_marker
    end
  end

  def self.check_records(event_id, competition_id, value_column, value_type)
    competition_scope = self.competition_scope(event_id, competition_id)

    records_registry = {}
    result_rows = []

    self.find_by_interval(CHECK_RECORDS_INTERVAL, competition_scope) do |comp|
      # Cannot use Rails' hyper-efficient `find_each`, see self#find_by_interval documentation.
      self.results_scope(comp, event_id, value_column).each do |r|
        value_solve = r.send("#{value_column}_solve".to_sym)

        # Skip DNF, DNS, invalid Multi attempts
        next if value_solve.incomplete?

        event_records = records_registry[r.event_id] || {}
        computed_marker, event_records = self.compute_record_marker(event_records, r, value_solve.wca_value)

        # write back current state of (computed) records for next competition(s)
        records_registry[r.event_id] = event_records

        stored_marker = r.send("regional#{value_type}Record".to_sym)

        # Nothing to see here. Go on.
        next unless computed_marker.present? || stored_marker.present?
        next unless self.relevant_result(event_id, competition_id, r, computed_marker, stored_marker)

        result_rows.push({
                           computed_marker: computed_marker,
                           result: r
                         })
      end
    end

    result_rows
  end
end
