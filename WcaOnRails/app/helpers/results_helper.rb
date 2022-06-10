# frozen_string_literal: true

module ResultsHelper
  def solve_tds_for_result(result)
    result.solve_times.each_with_index.map do |solve_time, i|
      classes = ["solve", i.to_s]
      classes << "trimmed" if result.trimmed_indices.include?(i)
      classes << "best" if i == result.best_index
      classes << "worst" if i == result.worst_index
      content_tag :td, solve_time.clock_format, class: classes.join(' ')
    end.reduce(:+)
  end

  # NOTE: PB markers are computed in the order in which results are given.
  def historical_pb_markers(results)
    Hash.new { |hash, key| hash[key] = {} }.tap do |markers|
      pb_single = results.first.best_solve
      pb_average = results.first.average_solve
      results.each do |result|
        if result.best_solve.complete? && result.best_solve <= pb_single
          pb_single = result.best_solve
          markers[result.id][:single] = true
        end
        if result.average_solve.complete? && result.average_solve <= pb_average
          pb_average = result.average_solve
          markers[result.id][:average] = true
        end
      end
    end
  end

  def compute_rankings_by_region(rows, continent, country)
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

  def compute_slim_or_separate_records(rows)
    single_rows = []
    average_rows = []
    rows
      .group_by { |row| row["eventId"] }
      .each do |event_id, event_rows|
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

  def pb_type_class_for_result(regional_record, pb_marker)
    if pb_marker
      record_class = 'pb'
      if regional_record.present?
        case regional_record
        when 'WR'
          record_class = 'wr'
        when 'NR'
          record_class = 'nr'
        else
          record_class = 'cr'
        end
      end
    end
    record_class
  end
end
