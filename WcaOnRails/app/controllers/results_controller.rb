# frozen_string_literal: true

class ResultsController < ApplicationController
  def rankings
    support_old_links!

    # Default params
    params[:region] ||= "world"
    params[:years] ||= "all years"
    params[:show] ||= "100 persons"

    shared_constants_and_conditions

    @quantities = ["100", "1000"]

    if !@types.include?(params[:type])
      flash[:danger] = t(".unknown_type")
      return redirect_to rankings_path(params[:event_id], "single")
    end
    @is_average = params[:type] == @types[1]
    value = @is_average ? "average" : "best"
    capitalized_type_param = params[:type].capitalize

    @is_by_region = params[:show] == "by region"
    splitted_show_param = params[:show].split
    @show = splitted_show_param[0].to_i
    @is_persons = splitted_show_param[1] == "persons"
    @is_results = splitted_show_param[1] == "results"
    limit_condition = "LIMIT #{@show}"

    if @is_persons
      @query = <<-SQL
        SELECT
          result.*,
          result.#{value} value
        FROM (
          SELECT MIN(valueAndId) valueAndId
          FROM Concise#{capitalized_type_param}Results result
          WHERE 1
            #{@event_condition}
            AND #{value} > 0
            #{@years_condition}
            #{@region_condition}
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
          #{@years_condition.present? ? "JOIN Competitions competition on competition.id = competitionId" : ""}
          WHERE 1
            #{@event_condition}
            AND average > 0
            #{@years_condition}
            #{@region_condition}
          ORDER BY
            average
          #{limit_condition}
        SQL
        @query = <<-SQL
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
            #{@years_condition.present? ? "JOIN Competitions competition on competition.id = competitionId" : ""}
            WHERE 1
              #{@event_condition}
              AND value#{i} > 0
              #{@years_condition}
              #{@region_condition}
            ORDER BY value
            #{limit_condition}
          SQL
        end
        subquery = "(" + subqueries.join(") UNION ALL (") + ")"
        @query = <<-SQL
          SELECT *
          FROM (#{subquery}) result
          ORDER BY value, personName, competitionId, roundTypeId
          #{limit_condition}
        SQL
      end
    elsif @is_by_region
      @query = <<-SQL
        SELECT
          result.*,
          result.#{value} value
        FROM (
          SELECT
            countryId recordCountryId,
            MIN(#{value}) recordValue
          FROM Concise#{capitalized_type_param}Results result
          WHERE 1
            #{@event_condition}
            #{@years_condition}
          GROUP BY countryId
        ) record
        JOIN Results result ON result.#{value} = recordValue AND result.countryId = recordCountryId
        JOIN Competitions competition on competition.id = competitionId
        WHERE 1
          #{@event_condition}
          #{@years_condition}
        ORDER BY value, countryId, start_date, personName
      SQL
    else
      flash[:danger] = t(".unknown_show")
      return redirect_to rankings_path
    end
  end

  def records
    support_old_links!

    # Default params
    params[:event_id] ||= "all events"
    params[:region] ||= "world"
    params[:years] ||= "all years"
    params[:show] ||= "mixed"

    @shows = ["mixed", "slim", "separate", "history", "mixed history"]
    @is_mixed = params[:show] == @shows[0]
    @is_slim = params[:show] == @shows[1]
    @is_separate = params[:show] == @shows[2]
    @is_history = params[:show] == @shows[3]
    @is_mixed_history = params[:show] == @shows[4]
    @is_histories = @is_history || @is_mixed_history

    shared_constants_and_conditions

    if !@is_histories
      @query = <<-SQL
        SELECT *
        FROM
          (#{current_records_query("best", "single")}
          UNION
          #{current_records_query("average", "average")}) helper
        ORDER BY
          `rank`, type DESC, year, month, day, roundTypeId, personName
      SQL
    else
      if @is_history
        order = 'event.`rank`, type desc, value, year desc, month desc, day desc, roundType.`rank` desc'
      else
        order = 'year desc, month desc, day desc, event.`rank`, type desc, value, roundType.`rank` desc'
      end

      @query = <<-SQL
        SELECT
          year, month, day,
          event.id             eventId,
          event.name           eventName,
          event.cellName       eventCellName,
          result.type          type,
          result.value         value,
          result.formatId      formatId,
          result.roundTypeId   roundTypeId,
          event.format         valueFormat,
                               recordName,
          result.personId      personId,
          result.personName    personName,
          result.countryId     countryId,
          country.name         countryName,
          competition.id       competitionId,
          competition.cellName competitionName,
          value1, value2, value3, value4, value5
        FROM
          (SELECT Results.*, 'single' type, best    value, regionalSingleRecord  recordName FROM Results WHERE regionalSingleRecord<>'' UNION
            SELECT Results.*, 'average' type, average value, regionalAverageRecord recordName FROM Results WHERE regionalAverageRecord<>'') result,
          Events event,
          RoundTypes roundType,
          Competitions competition,
          Countries country
        WHERE event.id = eventId
          AND event.`rank` < 1000
          AND roundType.id = roundTypeId
          AND competition.id = competitionId
          AND country.id = result.countryId
          #{@region_condition}
          #{@event_condition}
          #{@years_condition}
        ORDER BY
          #{order}
      SQL
    end
  end

  private def current_records_query(value, type)
    <<-SQL
      SELECT
        '#{type}'            type,
                             result.*,
                             value,
        event.name           eventName,
        event.cellName       eventCellName,
                             format,
        country.name         countryName,
        competition.cellName competitionName,
                             `rank`, year, month, day
      FROM
        (SELECT eventId recordEventId, MIN(valueAndId) DIV 1000000000 value
          FROM Concise#{type.capitalize}Results result
          WHERE 1
          #{@event_condition}
          #{@region_condition}
          #{@years_condition}
          GROUP BY eventId) record,
        Results result,
        Events event,
        Countries country,
        Competitions competition
      WHERE result.#{value} = value
        #{@event_condition}
        #{@region_condition}
        #{@years_condition}
        AND result.eventId = recordEventId
        AND event.id       = result.eventId
        AND country.id     = result.countryId
        AND competition.id = result.competitionId
        AND event.`rank` < 990
    SQL
  end

  private def shared_constants_and_conditions
    @years = Competition.non_future_years
    @types = ["single", "average"]

    if params[:event_id] == "all events"
      @event_condition = ""
    else
      event = Event.c_find!(params[:event_id])
      @event_condition = "AND eventId = '#{event.id}'"
    end

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find(params[:region])
    if @continent.present?
      @region_condition = "AND result.countryId IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
      @region_condition += " AND recordName IN ('WR', '#{@continent.recordName}')" if @is_histories
    elsif @country.present?
      @region_condition = "AND result.countryId = '#{@country.id}'"
      @region_condition += " AND recordName <> ''" if @is_histories
    else
      @region_condition = ""
      @region_condition += "AND recordName = 'WR'" if @is_histories
    end

    @is_all_years = params[:years] == "all years"
    splitted_years_param = params[:years].split
    @is_only = splitted_years_param[0] == "only"
    @is_until = splitted_years_param[0] == "until"
    @year = splitted_years_param[1].to_i
    if @is_only
      @years_condition = "AND year = #{@year}"
    elsif @is_until
      @years_condition = "AND year <= #{@year}"
    else
      @years_condition = ""
    end
  end

  # Normalizes the params so that old links to rankings still work.
  private def support_old_links!
    params[:event_id]&.gsub!("+", " ")

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
