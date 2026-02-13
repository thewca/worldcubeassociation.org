# frozen_string_literal: true

class Api::V0::Results::RankingsController < Api::V0::Results::ResultsController
  def index
    support_old_links!

    # Default params
    params[:region] ||= REGION_WORLD
    params[:years] = YEARS_ALL # FIXME: this is disabling years filters for now
    params[:show] ||= SHOW_100_PERSONS
    params[:gender] ||= GENDER_ALL

    params[:show] = params[:show].gsub(/\d+/, "100") # FIXME: this is disabling anything except show 100 for now

    shared_constants_and_conditions

    record_timestamp = ComputeAuxiliaryData.successful_start_date || Date.current
    cache_params = ResultsController.compute_cache_key(MODE_RANKINGS_NEXT, **params_for_cache)

    is_average = params[:type] == @types[1]
    value = is_average ? "average" : "best"
    type_param = params[:type]

    is_by_region = params[:show] == "by region"
    splitted_show_param = params[:show].split
    show = splitted_show_param[0].to_i
    is_persons = splitted_show_param[1] == "persons"
    is_results = splitted_show_param[1] == "results"
    limit_condition = "LIMIT #{show}"

    query = if is_persons
              <<~SQL.squish
                SELECT
                  results.*,
                  results.#{value} value,
                  competitions.cell_name competition_name,
                  competitions.country_id competition_country_id
                FROM (
                  SELECT MIN(value_and_id) value_and_id
                  FROM concise_#{type_param}_results results
                  #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
                  WHERE #{value} > 0
                    #{@event_condition}
                    #{@region_condition}
                    #{@gender_condition}
                  GROUP BY person_id
                  ORDER BY value_and_id
                  #{limit_condition}
                ) top
                JOIN results ON results.id = value_and_id % 1000000000
                JOIN competitions on competitions.id = results.competition_id
                ORDER BY value, person_name
              SQL
            elsif is_results
              if is_average
                <<~SQL.squish
                  SELECT
                    results.*,
                    average value,
                    competitions.cell_name competition_name,
                    competitions.country_id competition_country_id
                  FROM results
                  #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
                  JOIN competitions on competitions.id = results.competition_id
                  WHERE average > 0
                    #{@event_condition}
                    #{@region_condition}
                    #{@gender_condition}
                  ORDER BY
                    average, person_name, competition_id, round_type_id
                  #{limit_condition}
                SQL
              else
                <<~SQL.squish
                  SELECT
                    results.*,
                    result_attempts.value,
                    competitions.cell_name competition_name,
                    competitions.country_id competition_country_id
                  FROM (
                    SELECT results.id
                    FROM results
                    #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
                    WHERE best > 0
                      #{@event_condition}
                      #{@region_condition}
                      #{@gender_condition}
                    ORDER BY best, person_name, competition_id, round_type_id
                    #{limit_condition}
                  ) AS best_results
                    INNER JOIN results ON results.id = best_results.id
                    INNER JOIN result_attempts ON result_attempts.result_id = results.id
                    JOIN competitions on competitions.id = results.competition_id
                  WHERE value > 0
                  ORDER BY value, person_name, competition_id, round_type_id
                  #{limit_condition}
                SQL
              end
            elsif is_by_region
              <<~SQL.squish
                SELECT
                  results.*,
                  results.#{value} value,
                  competitions.cell_name competition_name,
                  competitions.country_id competition_country_id
                FROM (
                  SELECT
                    results.country_id record_country_id,
                    MIN(#{value}) record_value
                  FROM concise_#{type_param}_results results
                  #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
                  WHERE 1
                    #{@event_condition}
                    #{@gender_condition}
                  GROUP BY results.country_id
                ) records
                JOIN results ON results.#{value} = record_value AND results.country_id = record_country_id
                JOIN competitions on competitions.id = results.competition_id
                #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
                WHERE 1
                  #{@event_condition}
                  #{@gender_condition}
                ORDER BY value, results.country_id, start_date, person_name
              SQL
            end

    # TODO: move this to rankings-page-api when migration to next is done so this can be properly precompute
    rankings = Rails.cache.fetch ["rankings-page-api-next", *cache_params, record_timestamp] do
      DbHelper.execute_cached_query(cache_params, record_timestamp, query)
    end

    rankings = rankings.to_a

    render json: {
      rankings: rankings,
      timestamp: record_timestamp,
    }
  end
end
