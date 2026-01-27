# frozen_string_literal: true

module AuxiliaryDataComputation
  def self.compute_everything
    self.compute_concise_results
    self.compute_rank_tables
    self.insert_regional_records_lookup
  end

  ## Build 'concise results' tables.
  def self.compute_concise_results
    [
      %w[best concise_single_results],
      %w[average concise_average_results],
    ].each do |field, table_name|
      DbHelper.with_temp_table(table_name) do |temp_table_name|
        ActiveRecord::Base.connection.execute <<-SQL.squish
          INSERT INTO #{temp_table_name} (id, #{field}, value_and_id, person_id, event_id, country_id, continent_id, year, month, day)
          SELECT
            results.id,
            #{field},
            valueAndId,
            person_id,
            event_id,
            countries.id country_id,
            continent_id,
            YEAR(start_date) year,
            MONTH(start_date) month,
            DAY(start_date) day
          FROM (
              SELECT MIN(#{field} * 1000000000 + results.id) valueAndId
              FROM results
              JOIN competitions ON competitions.id = competition_id
              WHERE #{field} > 0
              GROUP BY person_id, results.country_id, event_id, YEAR(start_date)
            ) MinValuesWithId
            JOIN results ON results.id = valueAndId % 1000000000
            JOIN competitions ON competitions.id = results.competition_id
            JOIN countries ON countries.id = results.country_id
            JOIN events ON events.id = results.event_id
        SQL
      end
    end
  end

  ## Build rank tables.
  def self.compute_rank_tables
    [
      %w[best ranks_single concise_single_results],
      %w[average ranks_average concise_average_results],
    ].each do |field, table_name, concise_table_name|
      DbHelper.with_temp_table(table_name) do |temp_table_name|
        ActiveRecord::Base.connection.execute <<-SQL.squish
          INSERT INTO #{temp_table_name} (person_id, event_id, best, world_rank, continent_rank, country_rank)
          WITH current_person_data AS (
            SELECT wca_id, country_id, continent_id
            FROM persons
              INNER JOIN countries ON persons.country_id = countries.id
            WHERE sub_id = 1
          ),
          person_stats AS (
            SELECT r.person_id,
                   r.event_id,
                   r.#{field} AS value,
                   r.id AS result_id,
                   ROW_NUMBER() OVER (
                     PARTITION BY r.person_id, r.event_id
                     ORDER BY r.#{field}, r.id
                   ) AS rn,
                   MIN(CASE WHEN r.continent_id = p.continent_id THEN r.#{field} END)
                     OVER (PARTITION BY r.person_id, r.event_id) AS continent_valid_best,
                   MIN(CASE WHEN r.country_id = p.country_id THEN r.#{field} END)
                     OVER (PARTITION BY r.person_id, r.event_id) AS country_valid_best,
                   p.continent_id AS current_continent_id,
                   p.country_id AS current_country_id
            FROM #{concise_table_name} r
              INNER JOIN current_person_data p ON r.person_id = p.wca_id
          )
          SELECT person_id,
                 event_id,
                 value,
                 RANK() OVER (PARTITION BY event_id ORDER BY value) AS world_rank,
                 IF(continent_valid_best IS NULL, 0,
                   RANK() OVER (
                     PARTITION BY event_id, current_continent_id
                     ORDER BY (continent_valid_best IS NULL), continent_valid_best
                   )
                 ) AS continent_rank,
                 IF(country_valid_best IS NULL, 0,
                   RANK() OVER (
                     PARTITION BY event_id, current_country_id
                     ORDER BY (country_valid_best IS NULL), country_valid_best
                   )
                 ) AS country_rank
          FROM person_stats
          WHERE rn = 1
          ORDER BY event_id, value
        SQL
      end
    end
  end

  def self.insert_regional_records_lookup
    DbHelper.with_temp_table("regional_records_lookup") do |temp_table_name|
      CheckRegionalRecords.add_to_lookup_table(table_name: temp_table_name)
    end
  end
end
