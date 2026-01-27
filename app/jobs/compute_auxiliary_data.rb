# frozen_string_literal: true

class ComputeAuxiliaryData < WcaCronjob
  def self.reason_not_to_run
    "Some results are missing their corresponding WCA ID, which means that someone hasn't finished submitting results." if Result.exists?(person_id: "")
  end

  def perform
    AuxiliaryDataComputation.compute_everything

    # Trigger rankings computation based on the just-now-computed ranks,
    #   but insert them into the cache _before_ committing the "CAD has finished" timestamp to the DB
    self.recompute_popular_rankings
  end

  def recompute_popular_rankings
    # In the future, after this current run of the CAD job successfully finishes,
    #   the `start_date` will be written / copied over to `successful_start_date`, so we predict that
    #   the Records/Rankings pages will try and use that timestamp in the future once CAD has been completed.
    predicted_timestamp = self.class.start_date

    Event::OFFICIAL_IDS.each do |event_id|
      %w[single average].each do |result_type|
        # For averages, there's a column also called 'average'.
        #   But for singles, the column to look up is called 'best'.
        column_value = result_type.gsub('single', 'best')

        rankings_query = self.rankings_query(result_type, column_value, event_id)
        rankings_cache_key = ResultsController.compute_cache_key(ResultsController::MODE_RANKINGS, event_id: event_id, type: result_type, show: ResultsController::SHOW_100_PERSONS)

        DbHelper.execute_cached_query(
          rankings_cache_key,
          predicted_timestamp,
          rankings_query,
          db_role: :writing,
        )
      end
    end
  end

  ######
  # WARNING: Shameless copy-paste ahead!
  #
  # These queries originate from results_controller.rb. The cleanest solution would be to provide a method
  #   which -- given an event ID, a region, a gender, etc. -- returns the SQL query string to the caller.
  #   Both the controller as well as this job could then use that method.
  # However, coming up with that method would require significant refactoring because of how all the
  #   SQL `AND` conditions are currently glued together in different formats and different places,
  #   and because of how deeply intertwined the query build process is with the `@var` global variables in the controller.
  # Since we're only ever using the `event_id` filter here, and all other filters that the results_controller supports
  #   are obsolete for this job, we would end up with an overblown solution that isn't really used except in one
  #   place to its full potential (and here in a very, very trimmed-down version).
  # So this shameless copy-pasta is the most time-efficient way I could come up with (and the next time we need to
  #   touch these queries we will most likely redesign the schema so fundamentally that we can get rid of the current
  #   caching approach anyways, so maintenance is at a minimum here.)
  ######

  private def rankings_query(type, column, event_id)
    <<-SQL.squish
      SELECT
        results.*,
        results.#{column} value
      FROM (
        SELECT MIN(value_and_id) value_and_id
        FROM concise_#{type}_results results
        WHERE #{column} > 0
          AND event_id = '#{event_id}'
        GROUP BY person_id
        ORDER BY value_and_id
        LIMIT 100
      ) top
      JOIN results ON results.id = value_and_id % 1000000000
      ORDER BY value, person_name
    SQL
  end
end
