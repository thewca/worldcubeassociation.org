# frozen_string_literal: true

class ResultsController < ApplicationController
  REGION_WORLD = "world"
  YEARS_ALL = "all years"
  SHOW_100_PERSONS = "100 persons"
  SHOW_MIXED = "mixed"
  GENDER_ALL = "All"
  EVENTS_ALL = "all events"

  MODE_RANKINGS = "rankings"
  MODE_RECORDS = "records"

  def self.compute_cache_key(
    mode,
    event_id: EVENTS_ALL,
    region: REGION_WORLD,
    years: YEARS_ALL,
    gender: GENDER_ALL,
    show: nil,
    type: nil
  )
    # The specific order of the entries is determined by backwards compatibility with historical code.
    [mode, event_id, region, years, show, gender, type].compact
  end

  private def params_for_cache
    params.permit(:event_id, :region, :years, :show, :gender, :type).to_h.symbolize_keys
  end

  def rankings
    support_old_links!

    # Default params
    params[:region] ||= REGION_WORLD
    params[:years] = YEARS_ALL # FIXME: this is disabling years filters for now
    params[:show] ||= SHOW_100_PERSONS
    params[:gender] ||= GENDER_ALL

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

    @cache_params = ResultsController.compute_cache_key(MODE_RANKINGS, **params_for_cache)

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
      return redirect_to rankings_path
    end

    @ranking_timestamp = ComputeAuxiliaryData.successful_start_date || Date.current

    respond_from_cache("results-page-api") do |rows|
      @is_by_region ? compute_rankings_by_region(rows, @continent, @country) : rows
    end
  end

  def records
    support_old_links!

    # Default params
    params[:event_id] ||= EVENTS_ALL
    params[:region] ||= REGION_WORLD
    params[:years] = YEARS_ALL # FIXME: this is disabling years filters for now
    params[:show] ||= SHOW_MIXED
    params[:gender] ||= GENDER_ALL

    @shows = [SHOW_MIXED, "slim", "separate", "history", "mixed history"]
    @is_mixed = params[:show] == @shows[0]
    @is_slim = params[:show] == @shows[1]
    @is_separate = params[:show] == @shows[2]
    @is_history = params[:show] == @shows[3]
    @is_mixed_history = params[:show] == @shows[4]
    @is_histories = @is_history || @is_mixed_history

    shared_constants_and_conditions

    @cache_params = ResultsController.compute_cache_key(MODE_RECORDS, **params_for_cache)

    if @is_histories
      if @is_history
        order = 'event.`rank`, type desc, value, start_date desc, roundType.`rank` desc'
      else
        order = 'start_date desc, event.`rank`, type desc, value, roundType.`rank` desc'
      end

      @query = <<-SQL
        SELECT
          competition.start_date,
          YEAR(competition.start_date)  year,
          MONTH(competition.start_date) month,
          DAY(competition.start_date)   day,
          event.id             eventId,
          event.name           eventName,
          result.id            id,
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

    @record_timestamp = ComputeAuxiliaryData.successful_start_date || Date.current

    respond_from_cache("records-page-api") do |rows|
      @is_slim || @is_separate ? compute_slim_or_separate_records(rows) : rows
    end
  end

  private def current_records_query(value, type)
    <<-SQL
      SELECT
        '#{type}'            type,
                             result.*,
                             value,
        event.name           eventName,
                             format,
        country.name         countryName,
        competition.cellName competitionName,
                             `rank`,
        competition.start_date,
        YEAR(competition.start_date)  year,
        MONTH(competition.start_date) month,
        DAY(competition.start_date)   day
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

  private def compute_slim_or_separate_records(rows)
    single_rows = []
    average_rows = []
    rows
      .group_by { |row| row["eventId"] }
      .each_value do |event_rows|
      singles, averages = event_rows.partition { |row| row["type"] == "single" }
      balance = singles.size - averages.size
      if balance < 0
        singles += Array.new(-balance, nil)
      elsif balance > 0
        averages += Array.new(balance, nil)
      end
      single_rows += singles
      average_rows += averages
    end

    slim_rows = single_rows.zip(average_rows)
    [slim_rows, single_rows.compact, average_rows.compact]
  end

  private def shared_constants_and_conditions
    @years = Competition.non_future_years
    @types = ["single", "average"]

    if params[:event_id] == EVENTS_ALL
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

    @is_all_years = params[:years] == YEARS_ALL
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

  private def compute_rankings_by_region(rows, continent, country)
    if rows.empty?
      return [[], 0, 0]
    end
    best_value_of_world = rows.first["value"]
    best_values_of_continents = {}
    best_values_of_countries = {}
    world_rows = []
    continents_rows = []
    countries_rows = []
    rows.each do |row|
      result = LightResult.new(row)
      value = row["value"]

      world_rows << row if value == best_value_of_world

      if best_values_of_continents[result.country.continent.id].nil? || value == best_values_of_continents[result.country.continent.id]
        best_values_of_continents[result.country.continent.id] = value

        if (country.present? && country.continent.id == result.country.continent.id) || (continent.present? && continent.id == result.country.continent.id) || params[:region] == "world"
          continents_rows << row
        end
      end

      if best_values_of_countries[result.country.id].nil? || value == best_values_of_countries[result.country.id]
        best_values_of_countries[result.country.id] = value

        if (country.present? && country.id == result.country.id) || params[:region] == "world"
          countries_rows << row
        end
      end
    end

    first_continent_index = world_rows.length
    first_country_index = first_continent_index + continents_rows.length
    rows_to_display = world_rows + continents_rows + countries_rows
    [rows_to_display, first_continent_index, first_country_index]
  end

  private def respond_from_cache(key_prefix, &)
    respond_to do |format|
      format.html {}
      format.json do
        cached_data = Rails.cache.fetch [key_prefix, *@cache_params, @record_timestamp] do
          rows = DbHelper.execute_cached_query(@cache_params, @record_timestamp, @query)

          # First, extract unique competitions
          comp_ids = rows.map { |r| r["competitionId"] }.uniq
          competitions_by_id = Competition.where(id: comp_ids)
                                          .index_by(&:id)
                                          .transform_values { |comp| comp.as_json(methods: %w[country], include: [], only: %w[cellName id]) }

          # Now that we've remembered all competitions, we can safely transform the rows
          rows = yield rows if block_given?

          {
            rows: rows.as_json, competitionsById: competitions_by_id
          }
        end
        render json: cached_data
      end
    end
  end
end
