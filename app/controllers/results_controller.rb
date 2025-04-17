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
          result.*,
          result.#{value} value
        FROM (
          SELECT MIN(value_and_id) value_and_id
          FROM concise_#{type_param}_results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.person_id = persons.wca_id and persons.subId = 1" : ""}
          WHERE #{value} > 0
            #{@event_condition_snake}
            #{@years_condition_result}
            #{@region_condition_snake}
            #{@gender_condition}
          GROUP BY person_id
          ORDER BY value_and_id
          #{limit_condition}
        ) top
        JOIN Results result ON result.id = value_and_id % 1000000000
        ORDER BY value, personName
      SQL

    elsif @is_results
      if @is_average
        @query = <<-SQL.squish
          SELECT
            result.*,
            average value
          FROM Results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
          #{@years_condition_competition.present? ? "JOIN competitions on competitions.id = competitionId" : ""}
          WHERE average > 0
            #{@event_condition_camel}
            #{@years_condition_competition}
            #{@region_condition_camel}
            #{@gender_condition}
          ORDER BY
            average, personName, competitionId, roundTypeId
          #{limit_condition}
        SQL

      else
        subqueries = (1..5).map do |i|
          <<-SQL.squish
            SELECT
              result.*,
              value#{i} value
            FROM Results result
            #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
            #{@years_condition_competition.present? ? "JOIN competitions on competitions.id = competitionId" : ""}
            WHERE value#{i} > 0
              #{@event_condition_camel}
              #{@years_condition_competition}
              #{@region_condition_camel}
              #{@gender_condition}
            ORDER BY value
            #{limit_condition}
          SQL
        end
        subquery = "(#{subqueries.join(") UNION ALL (")})"
        @query = <<-SQL.squish
          SELECT *
          FROM (#{subquery}) result
          ORDER BY value, personName, competitionId, roundTypeId
          #{limit_condition}
        SQL
      end
    elsif @is_by_region
      @query = <<-SQL.squish
        SELECT
          result.*,
          result.#{value} value
        FROM (
          SELECT
            result.country_id record_country_id,
            MIN(#{value}) recordValue
          FROM concise_#{type_param}_results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.person_id = persons.wca_id and persons.subId = 1" : ""}
          WHERE 1
            #{@event_condition_snake}
            #{@years_condition_result}
            #{@gender_condition}
          GROUP BY result.country_id
        ) record
        JOIN Results result ON result.#{value} = recordValue AND result.countryId = record_country_id
        JOIN competitions on competitions.id = competitionId
        #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1" : ""}
        WHERE 1
          #{@event_condition_camel}
          #{@event_condition_camel}
          #{@years_condition_competition}
          #{@gender_condition}
        ORDER BY value, countryId, start_date, personName
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
      order = if @is_history
                'events.`rank`, type desc, value, start_date desc, round_types.`rank` desc'
              else
                'start_date desc, events.`rank`, type desc, value, round_types.`rank` desc'
              end

      @query = <<-SQL.squish
        SELECT
          competitions.start_date,
          YEAR(competitions.start_date)  year,
          MONTH(competitions.start_date) month,
          DAY(competitions.start_date)   day,
          events.id              eventId,
          events.name            eventName,
          result.id              id,
          result.type            type,
          result.value           value,
          result.formatId        formatId,
          result.roundTypeId     roundTypeId,
          events.format          valueFormat,
                                 record_name,
          result.personId        personId,
          result.personName      personName,
          result.countryId       countryId,
          countries.name         countryName,
          competitions.id        competitionId,
          competitions.cell_name competitionName,
          value1, value2, value3, value4, value5
        FROM
          (SELECT Results.*, 'single' type, best    value, regionalSingleRecord record_name FROM Results WHERE regionalSingleRecord<>'' UNION
            SELECT Results.*, 'average' type, average value, regionalAverageRecord record_name FROM Results WHERE regionalAverageRecord<>'') result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1," : ","}
          events,
          round_types,
          competitions,
          countries
        WHERE events.id = eventId
          AND events.`rank` < 1000
          AND round_types.id = roundTypeId
          AND competitions.id = competitionId
          AND countries.id = result.countryId
          #{@region_condition_camel}
          #{@event_condition_camel}
          #{@years_condition_competition}
          #{@gender_condition}
        ORDER BY
          #{order}
      SQL
    else
      @query = <<-SQL.squish
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
    <<-SQL.squish
      SELECT
        '#{type}'              type,
                               result.*,
                               value,
        events.name            eventName,
                               format,
        countries.name         countryName,
        competitions.cell_name competitionName,
                               `rank`,
        competitions.start_date,
        YEAR(competitions.start_date)  year,
        MONTH(competitions.start_date) month,
        DAY(competitions.start_date)   day
      FROM
        (SELECT event_id record_event_id, MIN(value_and_id) DIV 1000000000 value
          FROM concise_#{type}_results result
          #{@gender_condition.present? ? "JOIN Persons persons ON result.person_id = persons.wca_id and persons.subId = 1" : ""}
          WHERE 1
          #{@event_condition_snake}
          #{@region_condition_snake}
          #{@years_condition_result}
          #{@gender_condition}
          GROUP BY event_id) record,
        Results result
        #{@gender_condition.present? ? "JOIN Persons persons ON result.personId = persons.wca_id and persons.subId = 1," : ","}
        events,
        countries,
        competitions
      WHERE result.#{value} = value
        #{@event_condition_camel}
        #{@region_condition_camel}
        #{@years_condition_competition}
        #{@gender_condition}
        AND result.eventId  = record_event_id
        AND events.id       = result.eventId
        AND countries.id    = result.countryId
        AND competitions.id = result.competitionId
        AND events.`rank` < 990
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
      @event_condition_camel = @event_condition_snake = ""
    else
      event = Event.c_find!(params[:event_id])
      @event_condition_camel = "AND eventId = '#{event.id}'"
      @event_condition_snake = "AND event_id = '#{event.id}'"
    end

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find(params[:region])
    if @continent.present?
      @region_condition_camel = "AND result.countryId IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
      @region_condition_camel += " AND record_name IN ('WR', '#{@continent.record_name}')" if @is_histories
      @region_condition_snake = "AND result.country_id IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
      @region_condition_snake += " AND record_name IN ('WR', '#{@continent.record_name}')" if @is_histories
    elsif @country.present?
      @region_condition_camel = "AND result.countryId = '#{@country.id}'"
      @region_condition_camel += " AND record_name <> ''" if @is_histories
      @region_condition_snake = "AND result.country_id = '#{@country.id}'"
      @region_condition_snake += " AND record_name <> ''" if @is_histories
    else
      @region_condition_camel = @region_condition_snake = ""
      @region_condition_camel += "AND record_name = 'WR'" if @is_histories
      @region_condition_snake += "AND record_name = 'WR'" if @is_histories
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

    @is_all_years = params[:years] == YEARS_ALL
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
    params[:event_id]&.tr!("+", " ")

    params[:region]&.tr!("+", " ")

    params[:years]&.tr!("+", " ")
    params[:years] = nil if params[:years] == "all"

    params[:show]&.tr!("+", " ")
    params[:show]&.downcase!
    # We are not supporting the all option anymore!
    params[:show] = nil if params[:show]&.include?("all")
  end

  private def compute_rankings_by_region(rows, continent, country)
    return [[], 0, 0] if rows.empty?

    best_value_of_world = rows.first["value"]
    best_values_of_continents = {}
    best_values_of_countries = {}
    world_rows = []
    continents_rows = []
    countries_rows = []
    rows.each do |result|
      result_country = Country.c_find!(result["countryId"])
      value = result["value"]

      world_rows << result if value == best_value_of_world

      if best_values_of_continents[result_country.continent.id].nil? || value == best_values_of_continents[result_country.continent.id]
        best_values_of_continents[result_country.continent.id] = value

        continents_rows << result if (country.present? && country.continent.id == result_country.continent.id) || (continent.present? && continent.id == result_country.continent.id) || params[:region] == "world"
      end

      if best_values_of_countries[result_country.id].nil? || value == best_values_of_countries[result_country.id]
        best_values_of_countries[result_country.id] = value

        countries_rows << result if (country.present? && country.id == result_country.id) || params[:region] == "world"
      end
    end

    first_continent_index = world_rows.length
    first_country_index = first_continent_index + continents_rows.length
    rows_to_display = world_rows + continents_rows + countries_rows
    [rows_to_display, first_continent_index, first_country_index]
  end

  private def respond_from_cache(key_prefix, &)
    respond_to do |format|
      format.html
      format.json do
        cached_data = Rails.cache.fetch [key_prefix, *@cache_params, @record_timestamp] do
          rows = DbHelper.execute_cached_query(@cache_params, @record_timestamp, @query)

          # First, extract unique competitions
          comp_ids = rows.map { |r| r["competitionId"] }.uniq
          competitions_by_id = Competition.where(id: comp_ids)
                                          .index_by(&:id)
                                          .transform_values { |comp| comp.as_json(methods: %w[country], include: [], only: %w[cell_name id]) }

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
