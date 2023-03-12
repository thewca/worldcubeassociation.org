# frozen_string_literal: true

module CheckRegionalRecords
  # as of 3-2023, the amount of competitions happening within 3 months can comfortably fit into memory.
  CHECK_RECORDS_INTERVAL = 3.months
  REGION_WORLD = '__World'

  def self.find_by_interval(scope, interval_duration, last_competition = nil, &)
    iter_start_date = scope.minimum(:start_date)

    until iter_start_date.nil?
      iter_end_date = iter_start_date + interval_duration

      # Cannot use Rails' hyper-efficient `find_each` because it doesn't allow ORDER BY clauses.
      # The entire purpose of this method is essentially to replicate find_each with our custom ordering.
      scope.where("start_date >= ?", iter_start_date)
           .where("start_date < ?", iter_end_date)
           .each(&)

      iter_start_date = scope.where("start_date >= ?", iter_end_date)
                             .minimum(:start_date)
    end

    # As of writing this initial implementation, we loop over end_date STRICTLY less than the selected competition,
    # so we would exclude our target objective in the last loop. This is a hack to avoid redundant SQL OR filters.
    yield last_competition if last_competition.present?
  end

  def self.competition_scope(event_id, competition_id)
    # Ordering by start_date is _crucial_ as we're checking results over time.
    # A competition that starts later has the potential to set a new record.
    # Ordering by competition ID is pure cosmetics and useful for consistency in debugging.
    competition_scope = Competition.includes(:results).order("start_date, Competitions.id")

    if event_id.present?
      # If there's an event_id, care only for competitions that hold the event in question.
      # Quirk: If there are Results in the SQL tables with the desired event_id but with a
      #   competition_id that has no associated competition_event with that event_id,
      #   those Results won't be considered.
      competition_scope = competition_scope.where(results: { event_id: event_id })
    end

    model_competition = nil

    if competition_id.present?
      # Load the competition (complains via ActiveRecord if an invalid ID was used)
      model_competition = Competition.find(competition_id)

      # Use all competitions up to _but excluding_ the end date of the desired competition
      # because we currently don't have a reliable way of ordering results within one day
      competition_scope = competition_scope.where('end_date < ?', model_competition.start_date)
    end

    [competition_scope, model_competition]
  end

  def self.competition_results(competition, event_id)
    # Note that we're *deliberately* loading all results into a Rails array first,
    #   because these results have already been loaded from the SQL database as part of an `includes` scope above.
    competition_results = competition.results.to_a

    if event_id.present?
      # If there's an event_id, focus on those results only.
      competition_results = competition_results.filter { |r| r.event_id == event_id }
    end

    # Pre-ordering with a JOIN on RoundTypes makes no sense as Ruby sorting algorithms are not stable :(
    competition_results
  end

  def self.compute_record_marker(event_records, result, wca_value)
    computed_marker = nil

    # Pretty straight-forward computation. Check all of the records that have been iterated until now (event_records)
    # and if you find a better result (equalling is enough, hence <= instead of <) set the marker and remember the new record.
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

  SOLUTION_TYPES = [[:best, 'Single'], [:average, 'Average']].freeze

  def self.check_records(event_id, competition_id)
    competition_scope, model_competition = self.competition_scope(event_id, competition_id)

    check_results = {}

    records_registry = {}
    records_pending_cache = {}

    # Need to keep track of when we switch competitions
    last_competition_id = nil

    # Why do we iterate over competitions instead of iterating over (Results JOIN Competitions) directly?
    #   (a) Joining over the Results table (which is notoriously big) is sinfully expensive when repeated.
    #     This especially holds true when repeatedly querying from the same table structure as we're doing below.
    #   (b) We need the start_date of competitions as sorting criteria. Iterating over comps as a "helper" allows us
    #     to relegate this as an ORDER BY clause to our SQL database.
    #   (c) (In the future) this will allow us to cache all computed records up to a certain date and cache them
    #     for significant performance boosts and improvements (but we should think about _how_ to cache them first.)
    #   (d) It helps us to compute the correct temporal order of records, because we don't know the order of events within
    #     a day (yet), which means that we have to do manual shenanigans that are easier when we have the competition object.
    self.find_by_interval(competition_scope, CHECK_RECORDS_INTERVAL, model_competition) do |comp|
      # Fetch the attached Result rows per competition only _once_,
      # and then re-order the same set in-memory for single and average computations.
      results = self.competition_results(comp, event_id)

      # this entire if-block can be removed once we're able to order results within a competition
      if comp.id != last_competition_id
        still_pending = []

        records_pending_cache.each do |cache|
          if comp.start_date > cache[:end_date]
            cache[:records].each do |col, events|
              records_registry[col] ||= {}

              events.each do |event, regions|
                records_registry[col][event] ||= {}

                regions.each do |region, record|
                  if !records_registry[col][event].key?(region) || record < records_registry[col][event][region]
                    records_registry[col][event][region] = record
                  end
                end
              end
            end
          else
            still_pending.push(cache)
          end
        end

        records_pending_cache = still_pending
        last_competition_id = comp.id
      end

      # We're not allowed to directly write back to `records_registry` for competitions that happen on the same weekend
      #   (see also remark (d) in the big comment above)
      temporary_registry = records_registry.deep_dup

      SOLUTION_TYPES.each do |value_column, value_name|
        # Ordering by RoundType is _crucial_ because the `rank` property encodes information
        # about the temporal sequence of rounds (i.e. a Final has a higher `rank` than
        #   a First Round because a Final comes after the First Round in a schedule.)
        # Ordering by the actual value is also _crucial_, because we mark records eagerly,
        #   i.e. as soon as a faster result is found it is immediately marked, without checking
        #   whether an _even faster_ result occured in the same round.
        sorted_results = results.sort_by { |r| [r.round_type.rank, r.send(value_column)] }

        check_results[value_column] ||= []
        temporary_registry[value_column] ||= {}

        sorted_results.each do |r|
          value_solve = r.send("#{value_column}_solve".to_sym)

          # Skip DNF, DNS, invalid Multi attempts
          next if value_solve.incomplete?

          event_records = temporary_registry[value_column][r.event_id] || {}
          computed_marker, event_records = self.compute_record_marker(event_records, r, value_solve.wca_value)

          # write back current state of (computed) records for next competition(s)
          temporary_registry[value_column][r.event_id] = event_records

          stored_marker = r.send("regional#{value_name}Record".to_sym)

          # Nothing to see here. Go on.
          next unless computed_marker.present? || stored_marker.present?
          next unless self.relevant_result(event_id, competition_id, r, computed_marker, stored_marker)

          check_results[value_column].push({
                                             computed_marker: computed_marker,
                                             competition_start_date: comp.start_date,
                                             competition_end_date: comp.end_date,
                                             competition_name: comp.name,
                                             result: r,
                                           })
        end

        records_pending_cache.push({
                                     end_date: comp.end_date,
                                     records: temporary_registry,
                                   })
      end
    end

    check_results
  end
end
