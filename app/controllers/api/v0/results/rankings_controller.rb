# frozen_string_literal: true

class Api::V0::Results::RankingsController < Api::V0::ApiController
  def rankings
    support_old_links!

    # Default params
    params[:region] ||= REGION_WORLD
    params[:years] = YEARS_ALL # FIXME: this is disabling years filters for now
    params[:show] ||= SHOW_100_PERSONS
    params[:gender] ||= GENDER_ALL

    params[:show] = params[:show].gsub(/\d+/, "100") # FIXME: this is disabling anything except show 100 for now

    shared_constants_and_conditions

    @quantities = %w[100 1000]

    if @types.exclude?(params[:type])
      flash[:danger] = t(".unknown_type")
      return redirect_to rankings_path(params[:event_id], "single")
    end
    @is_average = params[:type] == @types[1]
    value = @is_average ? "average" : "best"
    type_param = params[:type]

    @is_by_region = params[:show] == "by region"
    splitted_show_param = params[:show].split
    @show = splitted_show_param[0].to_i
    @is_persons = splitted_show_param[1] == "persons"
    @is_results = splitted_show_param[1] == "results"
    limit_condition = "LIMIT #{@show}"

    @cache_params = ResultsController.compute_cache_key(MODE_RANKINGS, **params_for_cache)

    if @is_persons
      @query = <<-SQL.squish
        SELECT
          results.*,
          results.#{value} value
        FROM (
          SELECT MIN(value_and_id) value_and_id
          FROM concise_#{type_param}_results results
          #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
          WHERE #{value} > 0
            #{@event_condition}
            #{@years_condition_result}
            #{@region_condition}
            #{@gender_condition}
          GROUP BY person_id
          ORDER BY value_and_id
          #{limit_condition}
        ) top
        JOIN results ON results.id = value_and_id % 1000000000
        ORDER BY value, person_name
      SQL

    elsif @is_results
      if @is_average
        @query = <<-SQL.squish
          SELECT
            results.*,
            average value
          FROM results
          #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
          #{'JOIN competitions on competitions.id = results.competition_id' if @years_condition_competition.present?}
          WHERE average > 0
            #{@event_condition}
            #{@years_condition_competition}
            #{@region_condition}
            #{@gender_condition}
          ORDER BY
            average, person_name, competition_id, round_type_id
          #{limit_condition}
        SQL

      else
        subqueries = (1..5).map do |i|
          <<-SQL.squish
            SELECT
              results.*,
              value#{i} value
            FROM results
            #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
            #{'JOIN competitions on competitions.id = results.competition_id' if @years_condition_competition.present?}
            WHERE value#{i} > 0
              #{@event_condition}
              #{@years_condition_competition}
              #{@region_condition}
              #{@gender_condition}
            ORDER BY value
            #{limit_condition}
          SQL
        end
        subquery = "(#{subqueries.join(') UNION ALL (')})"
        @query = <<-SQL.squish
          SELECT *
          FROM (#{subquery}) union_results
          ORDER BY value, person_name, competition_id, round_type_id
          #{limit_condition}
        SQL
      end
    elsif @is_by_region
      @query = <<-SQL.squish
        SELECT
          results.*,
          results.#{value} value
        FROM (
          SELECT
            results.country_id record_country_id,
            MIN(#{value}) record_value
          FROM concise_#{type_param}_results results
          #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
          WHERE 1
            #{@event_condition}
            #{@years_condition_result}
            #{@gender_condition}
          GROUP BY results.country_id
        ) records
        JOIN results ON results.#{value} = record_value AND results.country_id = record_country_id
        JOIN competitions on competitions.id = results.competition_id
        #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
        WHERE 1
          #{@event_condition}
          #{@years_condition_competition}
          #{@gender_condition}
        ORDER BY value, results.country_id, start_date, person_name
      SQL

    else
      flash[:danger] = t(".unknown_show")
      return redirect_to rankings_path
    end

    @record_timestamp = ComputeAuxiliaryData.successful_start_date || Date.current

    respond_from_cache("results-page-api") do |rows|
      @is_by_region ? compute_rankings_by_region(rows, @continent, @country) : rows
    end
  end
end
