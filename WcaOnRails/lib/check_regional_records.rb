# frozen_string_literal: true

module CheckRegionalRecords
  REGION_WORLD = '__World'

  def self.compute_record_marker(regional_records, result, wca_value)
    computed_marker = nil

    # Check all of the regional_records that have been iterated until now and update if you find a better result
    # Note that equalling a record is enough, hence <= instead of <
    if !regional_records.key?(result.country_id) || wca_value <= regional_records[result.country_id]
      computed_marker = 'NR'
      regional_records[result.country_id] = wca_value

      if !regional_records.key?(result.continent_id) || wca_value <= regional_records[result.continent_id]
        continental_record_name = result.continent.record_name
        computed_marker = continental_record_name

        regional_records[result.continent_id] = wca_value

        if !regional_records.key?(REGION_WORLD) || wca_value <= regional_records[REGION_WORLD]
          computed_marker = 'WR'
          regional_records[REGION_WORLD] = wca_value
        end
      end
    end

    [computed_marker, regional_records]
  end

  def self.confirm_records(confirmed_records, pending_competitions, next_start_date)
    still_pending = []

    pending_competitions.each do |cache|
      competition = cache[:competition]
      tentative_records = cache[:tentative_records]

      # We can "commit" the records to the confirmed_records storage
      # only if the next competition's start date is STRICTLY greater than the pending competition's end_date.
      # If the next start_date is equal to (as in "greater than or equal to") the pending competition's end_date,
      # there might be an overlap where the next competition started in the morning but the old competition set a record in the evening.
      if next_start_date > competition.end_date
        tentative_records.each do |region, record|
          if !confirmed_records.key?(region) || record < confirmed_records[region]
            confirmed_records[region] = record
          end
        end
      else
        still_pending.push(cache)
      end
    end

    [confirmed_records, still_pending]
  end

  def self.relevant_result?(event_id, competition_id, result, computed_marker, stored_marker)
    if event_id.present? && competition_id.present?
      result.event_id == event_id && result.competition_id == competition_id
    elsif event_id.present?
      result.event_id == event_id
    elsif competition_id.present?
      result.competition_id == competition_id
    else
      # If there is neither a specific event nor a specific competition, only show results when
      # the stored label and the computed label disagree. Otherwise, the result set would be _huge_
      computed_marker != stored_marker
    end
  end

  def self.load_ordered_results(event_id, competition_id, value_column, regional_record_marker)
    results_scope = Result

    results_scope = results_scope.where(competition_id: competition_id) if competition_id.present?
    results_scope = results_scope.where(event_id: event_id) if event_id.present?

    marked_records = results_scope.includes(:competition)
                                  .where.not({ regional_record_marker => '' })

    minimum_result_candidates = results_scope.select("eventId, competitionId, roundTypeId, countryId, MIN(#{value_column}) AS `value`")
                                             .where("#{value_column} > 0")
                                             .group("eventId, competitionId, roundTypeId, countryId")

    minimum_results = results_scope.includes(:competition)
                                   .select("Results.*")
                                   .from("Results, (#{minimum_result_candidates.to_sql}) AS `helper`")
                                   .where("Results.eventId = helper.eventId")
                                   .where("Results.competitionId = helper.competitionId")
                                   .where("Results.roundTypeId = helper.roundTypeId")
                                   .where("Results.countryId = helper.countryId")
                                   .where("Results.#{value_column} = helper.`value`")

    (marked_records + minimum_results).uniq(&:id)
                                      .sort_by do |r|
      [
        # Ordering by Event rank is cosmetic
        r.event.rank,
        # Ordering by Competition start date is the most important criterion for temporal order of results
        r.competition.start_date,
        # Ordering by competition ID makes sure that all rounds of one competition (see immediately below) stay together
        r.competition_id,
        # Ordering by Round Type rank is crucial because it encodes information about the order of rounds
        #   (e.g. Final has a higher rank than First Round, which is exactly what we want)
        r.round_type.rank,
        # Lastly, order the results by result value within a round because we compute records eagerly
        r.send(value_column),
      ]
    end
  end

  SOLUTION_TYPES = [[:best, 'Single'], [:average, 'Average']].freeze

  def self.check_records(event_id, competition_id)
    SOLUTION_TYPES.to_h do |value_column, value_name|
      # some helper symbols for further down
      regional_record_symbol = "regional#{value_name}Record".to_sym
      value_solve_symbol = "#{value_column}_solve".to_sym

      base_records = {}

      if competition_id.present?
        model_comp = Competition.find(competition_id)

        previous_min_results = Result.joins(:competition)
                                     .select("eventId, Results.countryId, MIN(#{value_column}) AS `value`")
                                     .where("#{value_column} > 0")
                                     .where("Competitions.end_date < ?", model_comp.start_date)
                                     .group("eventId, Results.countryId")

        previous_min_results.each do |r|
          event_records = base_records[r.event_id] || {}

          _, event_records = self.compute_record_marker(event_records, r, r.value)
          base_records[r.event_id] = event_records
        end
      end

      # Need to keep track of when we switch competitions
      current_event = nil
      current_competition = nil

      confirmed_records = {}
      tentative_records = {}

      # We're not allowed to directly write back to `records_registry` for competitions that happen on the same weekend
      pending_competitions = []

      check_results = self.load_ordered_results(event_id, competition_id, value_column, regional_record_symbol)
                          .map do |r|
        value_solve = r.send(value_solve_symbol)

        # Skip DNF, DNS, invalid Multi attempts
        next if value_solve.incomplete?

        if r.event_id != current_event&.id
          # make sure that we have a (dummy) base record set even when no competition was selected
          base_records[r.event_id] ||= {}

          confirmed_records = base_records[r.event_id].deep_dup

          current_competition = nil
          pending_competitions = []

          current_event = r.event
        end

        if r.competition_id != current_competition&.id
          # this entire merging behavior can be removed once we're able to order results among competitions
          if current_competition.present?
            pending_competitions.push({
                                        competition: current_competition,
                                        tentative_records: tentative_records,
                                      })
          end

          confirmed_records, pending_competitions = self.confirm_records(
            confirmed_records,
            pending_competitions,
            r.competition.start_date,
          )

          tentative_records = confirmed_records.deep_dup

          current_competition = r.competition
        end

        stored_marker = r.send(regional_record_symbol)
        computed_marker, tentative_records = self.compute_record_marker(tentative_records, r, value_solve.wca_value)

        # Nothing to see here. Go on.
        next unless computed_marker.present? || stored_marker.present?
        next unless self.relevant_result?(event_id, competition_id, r, computed_marker, stored_marker)

        {
          computed_marker: computed_marker,
          competition: r.competition,
          result: r,
        }
      end.compact

      [value_column, check_results]
    end
  end
end
