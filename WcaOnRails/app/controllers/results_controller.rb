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
          results.*,
          results.#{value} value
        FROM (
          SELECT MIN(valueAndId) valueAndId
          FROM Concise#{capitalized_type_param}Results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.sub_id = 1" : ""}
          WHERE #{value} > 0
            #{@event_condition}
            #{@years_condition_result}
            #{@region_condition}
            #{@gender_condition}
          GROUP BY personId
          ORDER BY valueAndId
          #{limit_condition}
        ) top
        JOIN results ON results.id = valueAndId % 1000000000
        ORDER BY value, person_name
      SQL

    elsif @is_results
      if @is_average
        @query = <<-SQL
          SELECT
            results.*,
            average value
          FROM results
          #{@gender_condition.present? ? "JOIN Persons persons ON results.person_id = persons.wca_id and persons.sub_id = 1" : ""}
          #{@years_condition_competition.present? ? "JOIN competitions on competitions.id = results.competition_id" : ""}
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
          <<-SQL
            SELECT
              results.*,
              value#{i} value
            FROM results
            #{@gender_condition.present? ? "JOIN Persons persons ON results.person_id = persons.wca_id and persons.sub_id = 1" : ""}
            #{@years_condition_competition.present? ? "JOIN competitions on competitions.id = results.competition_id" : ""}
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
          ORDER BY value, person_name, competition_id, round_type_id
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
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.sub_id = 1" : ""}
          WHERE 1
            #{@event_condition}
            #{@years_condition_result}
            #{@gender_condition}
          GROUP BY result.countryId
        ) record
        JOIN results ON results.#{value} = recordValue AND results.country_id = recordCountryId
        JOIN competitions on competitions.id = results.competition_id
        #{@gender_condition.present? ? "JOIN Persons persons ON results.person_id = persons.wca_id and persons.sub_id = 1" : ""}
        WHERE 1
          #{@event_condition}
          #{@years_condition_competition}
          #{@gender_condition}
        ORDER BY value, results.country_id, start_date, person_name
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
        order = 'events.`rank`, type desc, value, start_date desc, round_types.`rank` desc'
      else
        order = 'start_date desc, events.`rank`, type desc, value, round_types.`rank` desc'
      end

      @query = <<-SQL
        SELECT
          competitions.start_date,
          YEAR(competitions.start_date)  year,
          MONTH(competitions.start_date) month,
          DAY(competitions.start_date)   day,
          events.id              eventId,
          events.name            eventName,
          events.cell_name       event_cell_name,
          result.type            type,
          result.value           value,
          result.format_id       format_id,
          result.round_type_id   round_type_id,
          events.format          valueFormat,
                                 record_name,
          result.person_id       person_id,
          result.person_name     person_name,
          result.country_id      country_id,
          countries.name         countryName,
          competitions.id        competitionId,
          competitions.cell_name competitionName,
          value1, value2, value3, value4, value5
        FROM
          (SELECT results.*, 'single' type, best value, regional_single_record record_name FROM results WHERE regional_single_record<>'' UNION
            SELECT results.*, 'average' type, average value, regional_average_record record_name FROM results WHERE regional_average_record<>'') result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.person_id = persons.wca_id and persons.sub_id = 1," : ","}
          events,
          round_types,
          competitions,
          countries
        WHERE events.id = event_id
          AND events.`rank` < 1000
          AND round_types.id = round_type_id
          AND competitions.id = competitionId
          AND countries.id = result.country_id
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
          `rank`, type DESC, start_date, round_type_id, person_name
      SQL
    end
  end

  private def current_records_query(value, type)
    <<-SQL
      SELECT
        '#{type}'              type,
                               results.*,
                               value,
        events.name            eventName,
        events.cell_name       event_cell_name,
                               format,
        countries.name         countryName,
        competitions.cell_name competitionName,
                               `rank`,
        competitions.start_date,
        YEAR(competitions.start_date)  year,
        MONTH(competitions.start_date) month,
        DAY(competitions.start_date)   day
      FROM
        (SELECT eventId recordEventId, MIN(valueAndId) DIV 1000000000 value
          FROM Concise#{type.capitalize}Results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.sub_id = 1" : ""}
          WHERE 1
          #{@event_condition}
          #{@region_condition}
          #{@years_condition_result}
          #{@gender_condition}
          GROUP BY eventId) record,
        results
        #{@gender_condition.present? ? "JOIN Persons persons ON results.person_id = persons.wca_id and persons.sub_id = 1," : ","}
        events,
        countries,
        competitions
      WHERE results.#{value} = value
        #{@event_condition}
        #{@region_condition}
        #{@years_condition_competition}
        #{@gender_condition}
        AND results.event_id = recordEventId
        AND events.id        = results.event_id
        AND countries.id     = results.country_id
        AND competitions.id  = results.competition_id
        AND events.`rank` < 990
    SQL
  end

  private def shared_constants_and_conditions
    @years = Competition.non_future_years
    @types = ["single", "average"]

    if params[:event_id] == "all events"
      @event_condition = ""
    else
      event = Event.c_find!(params[:event_id])
      @event_condition = "AND event_id = '#{event.id}'"
    end

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find(params[:region])
    if @continent.present?
      @region_condition = "AND result.country_id IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
      @region_condition += " AND record_name IN ('WR', '#{@continent.record_name}')" if @is_histories
    elsif @country.present?
      @region_condition = "AND result.country_id = '#{@country.id}'"
      @region_condition += " AND record_name <> ''" if @is_histories
    else
      @region_condition = ""
      @region_condition += "AND record_name = 'WR'" if @is_histories
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
      @years_condition_competition = "AND YEAR(competitions.start_date) = #{@year}"
      @years_condition_result = "AND result.year = #{@year}"
    elsif @is_until
      @years_condition_competition = "AND YEAR(competitions.start_date) <= #{@year}"
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
