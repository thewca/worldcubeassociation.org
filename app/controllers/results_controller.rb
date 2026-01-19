# frozen_string_literal: true

class ResultsController < ApplicationController
  REGION_WORLD = "world"
  YEARS_ALL = "all years"
  SHOW_100_PERSONS = "100 persons"
  SHOWS = ['mixed', 'slim', 'separate', 'history', 'mixed history'].freeze
  GENDERS = %w[Male Female].freeze
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
      # rubocop:disable Style/ConditionalAssignment
      #   for better readability of the individual indentations of the SQL queries
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
        @query = <<-SQL.squish
          SELECT
            results.*,
            result_attempts.value
          FROM result_attempts
            INNER JOIN results ON result_attempts.result_id = results.id
          #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
          #{'JOIN competitions on competitions.id = results.competition_id' if @years_condition_competition.present?}
          WHERE value > 0
            #{@event_condition}
            #{@years_condition_competition}
            #{@region_condition}
            #{@gender_condition}
          ORDER BY value, person_name, competition_id, round_type_id
          #{limit_condition}
        SQL
      end
      # rubocop:enable Style/ConditionalAssignment
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

  def records
    support_old_links!

    # Default params
    params[:event_id] ||= EVENTS_ALL
    params[:region] ||= REGION_WORLD
    params[:years] = YEARS_ALL # FIXME: this is disabling years filters for now
    params[:show] ||= SHOW_MIXED
    params[:gender] ||= GENDER_ALL

    @is_mixed = params[:show] == SHOWS[0]
    @is_slim = params[:show] == SHOWS[1]
    @is_separate = params[:show] == SHOWS[2]
    @is_history = params[:show] == SHOWS[3]
    @is_mixed_history = params[:show] == SHOWS[4]
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
          events.id              event_id,
          events.name            event_name,
          results.id             id,
          results.type           type,
          results.value          value,
          results.format_id      format_id,
          results.round_type_id  round_type_id,
          events.format          value_format,
          results.record_name,
          results.person_id              person_id,
          results.person_name            person_name,
          results.country_id             country_id,
          countries.name                 country_name,
          competitions.id                competition_id,
          competitions.cell_name         competition_name,
          (
            SELECT GROUP_CONCAT(ra.value ORDER BY ra.attempt_number)
            FROM result_attempts ra
            WHERE ra.result_id = results.id
          ) AS result_details
        FROM
          (SELECT results.*, 'single' type, best value, regional_single_record record_name FROM results WHERE regional_single_record<>'' UNION
            SELECT results.*, 'average' type, average value, regional_average_record record_name FROM results WHERE regional_average_record<>'') results
          #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
          JOIN events ON results.event_id = events.id
          JOIN round_types ON results.round_type_id = round_types.id
          JOIN competitions ON results.competition_id = competitions.id
          JOIN countries ON results.country_id = countries.id
        WHERE events.`rank` < 1000
          #{@region_condition}
          #{@event_condition}
          #{@years_condition_competition}
          #{@gender_condition}
        ORDER BY
          #{order}
      SQL
    else
      @query = <<-SQL.squish
        SELECT *
        FROM
          (#{current_records_query('best', 'single')}
          UNION
          #{current_records_query('average', 'average')}) helper
        ORDER BY
          `rank`, type DESC, start_date, round_type_id, person_name
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
                               results.*,
                               value,
        events.name            event_name,
                               format,
        countries.name         country_name,
        competitions.cell_name competition_name,
                               `rank`,
        competitions.start_date,
        YEAR(competitions.start_date)  year,
        MONTH(competitions.start_date) month,
        DAY(competitions.start_date)   day
      FROM
        (SELECT event_id record_event_id, MIN(value_and_id) DIV 1000000000 value
          FROM concise_#{type}_results results
          #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
          WHERE 1
          #{@event_condition}
          #{@region_condition}
          #{@years_condition_result}
          #{@gender_condition}
          GROUP BY event_id) records,
        results
        #{'JOIN persons ON results.person_id = persons.wca_id and persons.sub_id = 1' if @gender_condition.present?}
        JOIN events ON results.event_id = events.id
        JOIN countries ON results.country_id = countries.id
        JOIN competitions ON results.competition_id = competitions.id
      WHERE events.`rank` < 990
        AND results.#{value} = value
        AND results.event_id = record_event_id
        #{@event_condition}
        #{@region_condition}
        #{@years_condition_competition}
        #{@gender_condition}
    SQL
  end

  private def compute_slim_or_separate_records(rows)
    single_rows = []
    average_rows = []
    rows
      .group_by { |row| row["event_id"] }
      .each_value do |event_rows|
      singles, averages = event_rows.partition { |row| row["type"] == "single" }
      balance = singles.size - averages.size
      if balance.negative?
        singles += Array.new(-balance, nil)
      elsif balance.positive?
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
    @types = %w[single average]

    if params[:event_id] == EVENTS_ALL
      @event_condition = ""
    else
      event = Event.c_find!(params[:event_id])
      @event_condition = "AND event_id = '#{event.id}'"
    end

    @continent = Continent.c_find(params[:region])
    @country = Country.c_find(params[:region])
    if @continent.present?
      @region_condition = "AND results.country_id IN (#{@continent.country_ids.map { |id| "'#{id}'" }.join(',')})"
      @region_condition += " AND record_name IN ('WR', '#{@continent.record_name}')" if @is_histories
    elsif @country.present?
      @region_condition = "AND results.country_id = '#{@country.id}'"
      @region_condition += " AND record_name <> ''" if @is_histories
    else
      @region_condition = ""
      @region_condition += "AND record_name = 'WR'" if @is_histories
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
      @years_condition_result = "AND results.year = #{@year}"
    elsif @is_until
      @years_condition_competition = "AND YEAR(competitions.start_date) <= #{@year}"
      @years_condition_result = "AND results.year <= #{@year}"
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
      result_country = Country.c_find!(result["country_id"])
      value = result["value"]

      world_rows << result if value == best_value_of_world

      if best_values_of_continents[result_country.continent.id].nil? || value == best_values_of_continents[result_country.continent.id]
        best_values_of_continents[result_country.continent.id] = value

        continents_rows << result if (country.present? && country.continent.id == result_country.continent.id) || (continent.present? && continent.id == result_country.continent.id) || params[:region] == "world"
      end

      next unless best_values_of_countries[result_country.id].nil? || value == best_values_of_countries[result_country.id]

      best_values_of_countries[result_country.id] = value

      countries_rows << result if (country.present? && country.id == result_country.id) || params[:region] == "world"
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
          comp_ids = rows.map { |r| r["competition_id"] }.uniq
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
