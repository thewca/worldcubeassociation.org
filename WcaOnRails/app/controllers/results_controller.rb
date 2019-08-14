# frozen_string_literal: true

class ResultsController < ApplicationController
  def rankings
    support_old_links!

    # Default params
    params[:region] ||= "world"
    params[:years] ||= "all years"
    params[:show] ||= "100 persons"

    @years = Competition.non_future_years

    @quantities = ["100", "1000"]

    @types = ["single", "average"]
    if !@types.include?(params[:type])
      flash[:danger] = t(".unknown_type")
      return redirect_to rankings_path(params[:event_id], "single")
    end
    @is_average = params[:type] == @types[1]
    value = @is_average ? "average" : "best"
    capitalized_type_param = params[:type].capitalize

    event = Event.c_find!(params[:event_id])
    event_condition = "AND eventId = '#{event.id}'"

    @is_by_region = params[:show] == "by region"
    splitted_show_param = params[:show].split
    @show = splitted_show_param[0].to_i
    @is_persons = splitted_show_param[1] == "persons"
    @is_results = splitted_show_param[1] == "results"
    limit_condition = "LIMIT #{@show}"

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find(params[:region])
    if @continent.present?
      region_condition = "AND result.countryId IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
    elsif @country.present?
      region_condition = "AND result.countryId = '#{@country.id}'"
    else
      region_condition = ""
    end

    @is_all_years = params[:years] == "all years"
    splitted_years_param = params[:years].split
    @is_only = splitted_years_param[0] == "only"
    @is_until = splitted_years_param[0] == "until"
    @year = splitted_years_param[1].to_i
    if @is_only
      years_condition = "AND year = #{@year}"
    elsif @is_until
      years_condition = "AND year <= #{@year}"
    else
      years_condition = ""
    end

    if @is_persons
      query = <<-SQL
        SELECT
          result.*,
          result.#{value} value
        FROM (
          SELECT MIN(valueAndId) valueAndId
          FROM Concise#{capitalized_type_param}Results result
          WHERE 1
            #{event_condition}
            AND #{value} > 0
            #{years_condition}
            #{region_condition}
          GROUP BY personId
          ORDER BY valueAndId
          #{limit_condition}
        ) top
        JOIN Results result ON result.id = valueAndId % 1000000000
        ORDER BY value, personName
      SQL
    elsif @is_results
      if @is_average
        subquery = <<-SQL
          SELECT
            result.*,
            average value
          FROM Results result
          #{years_condition.present? ? "JOIN Competitions competition on competition.id = competitionId" : ""}
          WHERE 1
            #{event_condition}
            AND average > 0
            #{years_condition}
            #{region_condition}
          ORDER BY
            average
          #{limit_condition}
        SQL
        query = <<-SQL
          SELECT *
          FROM (#{subquery}) result
          ORDER BY average, personName, competitionId, roundTypeId
        SQL
      else
        subqueries = (1..5).map do |i|
          <<-SQL
            SELECT
              result.*,
              value#{i} value
            FROM Results result
            #{years_condition.present? ? "JOIN Competitions competition on competition.id = competitionId" : ""}
            WHERE 1
              #{event_condition}
              AND value#{i} > 0
              #{years_condition}
              #{region_condition}
            ORDER BY value
            #{limit_condition}
          SQL
        end
        subquery = "(" + subqueries.join(") UNION ALL (") + ")"
        query = <<-SQL
          SELECT *
          FROM (#{subquery}) result
          ORDER BY value, personName, competitionId, roundTypeId
          #{limit_condition}
        SQL
      end
    elsif @is_by_region
      query = <<-SQL
        SELECT
          result.*,
          result.#{value} value
        FROM (
          SELECT
            countryId recordCountryId,
            MIN(#{value}) recordValue
          FROM Concise#{capitalized_type_param}Results result
          WHERE 1
            #{event_condition}
            #{years_condition}
          GROUP BY countryId
        ) record
        JOIN Results result ON result.#{value} = recordValue AND result.countryId = recordCountryId
        JOIN Competitions competition on competition.id = competitionId
        WHERE 1
          #{event_condition}
          #{years_condition}
        ORDER BY value, countryId, start_date, personName
      SQL
    else
      flash[:danger] = t(".unknown_show")
      return redirect_to rankings_path
    end

    @rows = ActiveRecord::Base.connection.exec_query(query)
    @competitions_by_id = Hash[
      Competition.where(id: @rows.map { |r| r["competitionId"] }.uniq).map do |c|
        [c.id, c]
      end
    ]
    compute_rankings_by_region if @is_by_region
  end

  def compute_rankings_by_region
    best_value_of_world = @rows.first["value"]
    best_values_of_continents = {}
    best_values_of_countries = {}
    world_rows = []
    continents_rows = []
    countries_rows = []
    @rows.each do |row|
      result = LightResult.new(row)
      value = row["value"]

      world_rows << row if value == best_value_of_world

      if best_values_of_continents[result.country.continent.id].nil? || value == best_values_of_continents[result.country.continent.id]
        best_values_of_continents[result.country.continent.id] = value

        if (@country.present? && @country.continent.id == result.country.continent.id) || (@continent.present? && @continent.id == result.country.continent.id) || params[:region] == "world"
          continents_rows << row
        end
      end

      if best_values_of_countries[result.country.id].nil? || value == best_values_of_countries[result.country.id]
        best_values_of_countries[result.country.id] = value

        if (@country.present? && @country.id == result.country.id) || params[:region] == "world"
          countries_rows << row
        end
      end
    end

    @first_continent_index = world_rows.length
    @first_country_index = @first_continent_index + continents_rows.length
    @rows_to_display = world_rows + continents_rows + countries_rows
  end

  # Normalizes the params so that old links to rankings still work.
  private def support_old_links!
    params[:region]&.gsub!("+", " ")

    params[:years]&.gsub!("+", " ")
    if params[:years] == "all"
      params[:years] = nil
    end

    params[:show]&.gsub!("+", " ")
    params[:show]&.downcase!
    # We are not supporting the all option anymore!
    if params[:show]&.include?("all")
      params[:show] = nil
    end
  end
end
