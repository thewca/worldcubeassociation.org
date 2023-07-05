# frozen_string_literal: true

class ResultsController < ApplicationController
  def rankings
    support_old_links!

    # Default params
    params[:region] ||= "world"
    params[:years] = "all years" # FIXME: this is disabling years filters for now
    params[:show] ||= "100 persons"
    params[:gender] ||= "All"

    params[:show] = params[:show].gsub(/\d+/, "100") # FIXME: this is disabling anything except show 100 for now

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

    @cache_params = ['rankings', params[:event_id], params[:region], params[:years], params[:show], params[:gender], params[:type]]

    if @is_persons
      @query = <<-SQL
        SELECT
          result.*,
          result.#{value} value
        FROM (
          SELECT MIN(valueAndId) valueAndId
          FROM Concise#{capitalized_type_param}Results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
          WHERE #{value} > 0
            #{@event_condition}
            #{@years_condition_result}
            #{@region_condition}
            #{@gender_condition}
          GROUP BY personId
          ORDER BY valueAndId
          #{limit_condition}
        ) top
        JOIN Results result ON result.id = valueAndId % 1000000000
        ORDER BY value, personName
      SQL

    elsif @is_results
      if @is_average
        @query = <<-SQL
          SELECT
            result.*,
            average value
          FROM Results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
          #{@years_condition_competition.present? ? "JOIN Competitions competition on competition.id = competitionId" : ""}
          WHERE average > 0
            #{@event_condition}
            #{@years_condition_competition}
            #{@region_condition}
            #{@gender_condition}
          ORDER BY
            average, personName, competitionId, roundTypeId
          #{limit_condition}
        SQL

      else
        subqueries = (1..5).map do |i|
          <<-SQL
            SELECT
              result.*,
              value#{i} value
            FROM Results result
            #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
            #{@years_condition_competition.present? ? "JOIN Competitions competition on competition.id = competitionId" : ""}
            WHERE value#{i} > 0
              #{@event_condition}
              #{@years_condition_competition}
              #{@region_condition}
              #{@gender_condition}
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
            result.countryId recordCountryId,
            MIN(#{value}) recordValue
          FROM Concise#{capitalized_type_param}Results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
          WHERE 1
            #{@event_condition}
            #{@years_condition_result}
            #{@gender_condition}
          GROUP BY result.countryId
        ) record
        JOIN Results result ON result.#{value} = recordValue AND result.countryId = recordCountryId
        JOIN Competitions competition on competition.id = competitionId
        #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
        WHERE 1
          #{@event_condition}
          #{@years_condition_competition}
          #{@gender_condition}
        ORDER BY value, countryId, start_date, personName
      SQL

    else
      flash[:danger] = t(".unknown_show")
      redirect_to rankings_path
    end
  end

  def records
    support_old_links!

    # Default params
    params[:event_id] ||= "all events"
    params[:region] ||= "world"
    params[:years] = "all years" # FIXME: this is disabling years filters for now
    params[:show] ||= "mixed"
    params[:gender] ||= "All"

    @shows = ["mixed", "slim", "separate", "history", "mixed history"]
    @is_mixed = params[:show] == @shows[0]
    @is_slim = params[:show] == @shows[1]
    @is_separate = params[:show] == @shows[2]
    @is_history = params[:show] == @shows[3]
    @is_mixed_history = params[:show] == @shows[4]
    @is_histories = @is_history || @is_mixed_history

    shared_constants_and_conditions

    @cache_params = ['records', params[:event_id], params[:region], params[:years], params[:show], params[:gender]]

    if @is_histories
      if @is_history
        order = 'event.`rank`, type desc, value, start_date desc, roundType.`rank` desc'
      else
        order = 'start_date desc, event.`rank`, type desc, value, roundType.`rank` desc'
      end

      @query = <<-SQL
        SELECT
          competition.start_date,
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
            SELECT Results.*, 'average' type, average value, regionalAverageRecord recordName FROM Results WHERE regionalAverageRecord<>'') result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1," : ","}
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
          #{@years_condition_competition}
          #{@gender_condition}
        ORDER BY
          #{order}
      SQL
    else
      @query = <<-SQL
        SELECT *
        FROM
          (#{current_records_query("best", "single")}
          UNION
          #{current_records_query("average", "average")}) helper
        ORDER BY
          `rank`, type DESC, start_date, roundTypeId, personName
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
                             `rank`, competition.start_date
      FROM
        (SELECT eventId recordEventId, MIN(valueAndId) DIV 1000000000 value
          FROM Concise#{type.capitalize}Results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
          WHERE 1
          #{@event_condition}
          #{@region_condition}
          #{@years_condition_result}
          #{@gender_condition}
          GROUP BY eventId) record,
        Results result
        #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1," : ","}
        Events event,
        Countries country,
        Competitions competition
      WHERE result.#{value} = value
        #{@event_condition}
        #{@region_condition}
        #{@years_condition_competition}
        #{@gender_condition}
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

    @gender = params[:gender]
    case params[:gender]
    when "Male"
      @gender_condition = "AND gender = 'm'"
    when "Female"
      @gender_condition = "AND gender = 'f'"
    else
      @gender_condition = ""
    end

    @is_all_years = params[:years] == "all years"
    splitted_years_param = params[:years].split
    @is_only = splitted_years_param[0] == "only"
    @is_until = splitted_years_param[0] == "until"
    @year = splitted_years_param[1].to_i

    if @is_only
      @years_condition_competition = "AND YEAR(competition.start_date) = #{@year}"
      @years_condition_result = "AND result.year = #{@year}"
    elsif @is_until
      @years_condition_competition = "AND YEAR(competition.start_date) <= #{@year}"
      @years_condition_result = "AND result.year <= #{@year}"
    else
      @years_condition_competition = ""
      @years_condition_result = ""
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
