# frozen_string_literal: true

module CheckRegionalRecords
  # as of 3-2023, the amount of competitions happening within 3 months can comfortably fit into memory.
  CHECK_RECORDS_INTERVAL = 3.months
  REGION_WORLD = '__World'

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

  def self.flush_records(records_registry, records_pending_cache, start_date)
    still_pending = []

    records_pending_cache.each do |cache|
      if start_date > cache[:end_date]
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

    [records_registry, still_pending]
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
    results_scope = Result

    results_scope = results_scope.where(competition_id: competition_id) if competition_id.present?
    results_scope = results_scope.where(event_id: event_id) if event_id.present?

    check_results = {}
    records_registry = {}

    SOLUTION_TYPES.each do |value_column, value_name|
      # We're not allowed to directly write back to `records_registry` for competitions that happen on the same weekend
      temporary_registry = records_registry.deep_dup
      records_pending_cache = []

      check_results[value_column] ||= []
      temporary_registry[value_column] ||= {}

      if competition_id.present?
        model_comp = Competition.find(competition_id)

        previous_min_results = Result.joins(:competition)
                                     .select("eventId, Results.countryId, MIN(#{value_column}) AS `value`")
                                     .where("#{value_column} > 0")
                                     .where("Competitions.end_date < ?", model_comp.start_date)
                                     .group("eventId, Results.countryId")

        previous_min_results.each do |r|
          event_records = temporary_registry[value_column][r.event_id] || {}

          _, event_records = self.compute_record_marker(event_records, r, r.value)
          temporary_registry[value_column][r.event_id] = event_records
        end
      end

      regional_record_symbol = "regional#{value_name}Record".to_sym
      value_solve_symbol = "#{value_column}_solve".to_sym

      marked_records = results_scope.includes(:competition)
                                    .where.not({ regional_record_symbol => '' })

      minimum_result_candidates = results_scope.select("eventId, competitionId, roundTypeId, countryId, MIN(#{value_column}) AS `#{value_column}`")
                                               .where("#{value_column} > 0")
                                               .group("eventId, competitionId, roundTypeId, countryId")

      minimum_results = results_scope.includes(:competition)
                                     .select("Results.*")
                                     .from("Results, (#{minimum_result_candidates.to_sql}) AS `helper`")
                                     .where("Results.eventId = helper.eventId")
                                     .where("Results.competitionId = helper.competitionId")
                                     .where("Results.roundTypeId = helper.roundTypeId")
                                     .where("Results.countryId = helper.countryId")
                                     .where("Results.#{value_column} = helper.#{value_column}")

      results = (marked_records + minimum_results).uniq(&:id)

      sorted_results = results.sort_by do |r|
        [
          # Ordering by Event rank is cosmetic
          r.event.rank,
          # Ordering by Competition start date is the most important criterion for temporal order of results
          r.competition.start_date,
          # Ordering by competition ID within one start date is mostly cosmetic and helps with reproducibility
          r.competition_id,
          # Ordering by Round Type rank is crucial because it encodes information about the order of rounds
          #   (e.g. Final has a higher rank than First Round, which is exactly what we want)
          r.round_type.rank,
          # Lastly, order the results by result value within a round because we compute records eagerly
          r.send(value_column),
        ]
      end

      # Need to keep track of when we switch competitions
      last_competition_id = nil

      sorted_results.each do |r|
        value_solve = r.send(value_solve_symbol)

        # Skip DNF, DNS, invalid Multi attempts
        next if value_solve.incomplete?

        # this entire if-block can be removed once we're able to order results within a competition
        if r.competition_id != last_competition_id
          records_pending_cache.push({
                                       end_date: r.competition.end_date,
                                       records: temporary_registry,
                                     })

          records_registry, records_pending_cache = self.flush_records(
            records_registry,
            records_pending_cache,
            r.competition.start_date,
          )

          last_competition_id = r.competition_id
        end

        event_records = temporary_registry[value_column][r.event_id] || {}
        computed_marker, event_records = self.compute_record_marker(event_records, r, value_solve.wca_value)

        # write back current state of (computed) records for next competition(s)
        temporary_registry[value_column][r.event_id] = event_records

        stored_marker = r.send(regional_record_symbol)

        # Nothing to see here. Go on.
        next unless computed_marker.present? || stored_marker.present?
        next unless self.relevant_result(event_id, competition_id, r, computed_marker, stored_marker)

        check_results[value_column].push({
                                           computed_marker: computed_marker,
                                           competition_start_date: r.competition.start_date,
                                           competition_end_date: r.competition.end_date,
                                           competition_name: r.competition.name,
                                           result: r,
                                         })
      end
    end

    check_results
  end
end
