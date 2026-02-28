# frozen_string_literal: true

class Api::V0::Results::RecordsController < Api::V0::Results::ResultsController
  def index
    # Default params
    params[:event_id] ||= EVENTS_ALL
    params[:region] ||= REGION_WORLD
    params[:years] = YEARS_ALL
    params[:show] ||= SHOW_MIXED
    params[:gender] ||= GENDER_ALL

    @is_history = params[:show] == "history"

    shared_constants_and_conditions

    cache_params = ResultsController.compute_cache_key(MODE_RECORDS_NEXT, **params_for_cache)
    record_timestamp = ComputeAuxiliaryData.successful_start_date || Date.current

    query = if @is_history
              <<~SQL.squish
                SELECT
                  results.*,
                  value,
                  competitions.cell_name competition_name,
                  competitions.start_date,
                  competitions.country_id competition_country_id
                FROM
                  (SELECT results.*, 'single' type, best value, regional_single_record record_name FROM results WHERE regional_single_record<>'' UNION
                    SELECT results.*, 'average' type, average value, regional_average_record record_name FROM results WHERE regional_average_record<>'') results
                  #{@gender_condition.present? ? 'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1,' : ','}
                  competitions
                WHERE
                  competitions.id = competition_id
                  #{@region_condition}
                  #{@gender_condition}
                ORDER BY
                  type desc, value, start_date desc
              SQL
            else
              <<~SQL.squish
                SELECT *
                FROM
                  (#{current_records_query('best', 'single')}
                  UNION
                  #{current_records_query('average', 'average')}) helper
                ORDER BY
                  type DESC, round_type_id, person_name
              SQL
            end
    # TODO: move this to records-page-api when migration to next is done so this can be properly precompute

    records = Rails.cache.fetch ["records-page-api-next", *cache_params, record_timestamp] do
      rows = DbHelper.execute_cached_query(cache_params, record_timestamp, query)

      # As of writing this comment, we are maintaining two frontends.
      #   Augmenting the attempts manually (instead of clever joining)
      #   is the most reasonable compromise for backwards-compatibility.
      # Feel free to improve this once the React-Rails frontend is dead.
      Result.augment_attempts(rows.as_json)
    end

    render json: {
      records: records.group_by { it["event_id"] },
      timestamp: record_timestamp,
    }
  end

  private def current_records_query(value, type)
    <<~SQL.squish
      SELECT
      '#{type}' type,
                results.*,
                value,
                competitions.cell_name competition_name,
                competitions.country_id competition_country_id
      FROM
        (SELECT event_id record_event_id, MIN(#{value}) value
          FROM concise_#{type}_results results
          #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
          WHERE 1
          #{@region_condition}
          #{@gender_condition}
          GROUP BY event_id) records,
        results
        #{@gender_condition.present? ? 'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1,' : ','}
        competitions
      WHERE results.#{value} = value
        #{@region_condition}
        #{@gender_condition}
        AND results.event_id = record_event_id
        AND competitions.id  = results.competition_id
    SQL
  end

  private def params_for_cache
    params.permit(:event_id, :region, :years, :show, :gender, :type).to_h.symbolize_keys
  end

  private def shared_constants_and_conditions
    @years = Competition.non_future_years
    @types = %w[single average]

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find_by_iso2(params[:region])
    if @continent.present?
      @region_condition = "AND results.country_id IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
      @region_condition += " AND record_name IN ('WR', '#{@continent.record_name}')" if @is_history
    elsif @country.present?
      @region_condition = "AND results.country_id = '#{@country.id}'"
      @region_condition += " AND record_name <> ''" if @is_history
    else
      @region_condition = ""
      @region_condition += "AND record_name = 'WR'" if @is_history
    end

    @gender = params[:gender]
    @gender_condition = case params[:gender]
                        when "Male"
                          "AND gender = 'm'"
                        when "Female"
                          "AND gender = 'f'"
                        else
                          ""
                        end
  end
end
