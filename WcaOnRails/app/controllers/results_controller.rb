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
    event_condition_without_and = "eventId = '#{event.id}'"

    @is_by_region = params[:show] == "by region"
    splitted_show_param = params[:show].split
    @show = splitted_show_param[0].to_i
    @is_persons = splitted_show_param[1] == "persons"
    @is_results = splitted_show_param[1] == "results"
    limit_condition = "LIMIT #{@show}"

    id_string = @is_results ? ".id" : "Id"
    @continent = Continent.c_find(params[:region])
    @country = Country.c_find(params[:region])
    if @continent.present?
      region_condition = "AND continentId = '#{@continent.id}'"
    elsif @country.present?
      region_condition = "AND country#{id_string} = '#{@country.id}'"
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
        SELECT result.*,
          result.#{value}       value,
          competition.cellName  competitionName,
          country.name          countryName
        FROM
          (SELECT MIN(valueAndId) valueAndId
            FROM Concise#{capitalized_type_param}Results result
            WHERE #{value} > 0
            #{event_condition}
            #{years_condition}
            #{region_condition}
            GROUP BY personId
            ORDER BY valueAndId
            #{limit_condition}) top,
          Results      result,
          Competitions competition,
          Countries    country
        WHERE
          result.id          = valueAndId % 1000000000
          AND competition.id = competitionId
          AND country.id     = result.countryId
        ORDER BY
          value, personName
      SQL
    elsif @is_results
      if @is_average
        query = <<-SQL
          SELECT result.*,
            result.#{value}      value,
            competition.cellName competitionName,
            country.name         countryName
          FROM
            Results      result,
            Competitions competition,
            Countries    country
          WHERE #{value} > 0
            #{event_condition}
            #{years_condition}
            #{region_condition}
            AND competition.id = competitionId
            AND country.id     = result.countryId
          ORDER BY
            value, best, personName, competitionId, roundTypeId
          #{limit_condition}
        SQL
      else
        subqueries = []
        (1..5).each do |i|
          subqueries[i-1] = <<-SQL
            SELECT
              value#{i}            value,
              personId,            personName,
              country.id           countryId,
              competitionId,
              competition.cellName competitionName,
              roundTypeId
            FROM
              Results      result,
              Competitions competition,
              Countries    country
            WHERE value#{i} > 0
              #{event_condition}
              #{years_condition}
              #{region_condition}
              AND competition.id = competitionId
              AND country.id     = result.countryId
            ORDER BY
              value, personName
            #{limit_condition}
          SQL
        end
        subquery = ("(" + subqueries.join(") UNION ALL (") + ")")

        query = <<-SQL
          SELECT *
          FROM
            (#{subquery}) result
          ORDER BY
            value, personName, competitionId, roundTypeId
          #{limit_condition}
        SQL
      end
    elsif @is_by_region
      query = <<-SQL
        SELECT
          result.personId      personId,
          result.personName    personName,
          result.eventId       eventId,
          result.formatId      formatId,
          result.roundTypeId   roundTypeId,
          country.id           countryId,
          country.name         countryName,
          continent.id         continentId,
          continent.name       continentName,
          competition.id       competitionId,
          competition.cellName competitionName,
          #{value}             value,
          event.format         valueFormat,
          value1, value2, value3, value4, value5
        FROM
          (SELECT countryId recordCountryId, MIN(#{value}) recordValue
            FROM Concise#{capitalized_type_param}Results result
            WHERE 1
            #{event_condition}
            #{years_condition}
            GROUP BY countryId) record,
          Results      result,
          Countries    country,
          Continents   continent,
          Competitions competition,
          Events       event
        WHERE
          #{event_condition_without_and}
          #{years_condition}
          AND result.#{value}  = recordValue
          AND result.countryId = recordCountryId
          AND country.id       = result.countryId
          AND continent.id     = continentId
          AND competition.id   = competitionId
          AND event.id         = eventId
        ORDER BY
          value, countryId, year, month, day, personName
      SQL
    else
      flash[:danger] = t(".unknown_show")
      return redirect_to rankings_path
    end

    @rows = ActiveRecord::Base.connection.exec_query(query)
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
