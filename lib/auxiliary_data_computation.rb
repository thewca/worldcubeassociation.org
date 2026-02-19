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
        ActiveRecord::Base.connection.execute <<~SQL.squish
          INSERT INTO #{temp_table_name} (id, #{field}, value_and_id, person_id, event_id, country_id, continent_id, reg_year)
          SELECT
            results.id,
            #{field},
            valueAndId,
            person_id,
            event_id,
            countries.id country_id,
            continent_id,
            YEAR(start_date) reg_year
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
        ActiveRecord::Base.connection.execute <<~SQL.squish
          INSERT INTO #{temp_table_name} (person_id, event_id, best, world_rank, continent_rank, country_rank)
          WITH personal_bests AS (
            SELECT
              person_id,
              event_id,
              continent_id,
              country_id,
              MIN(#{field}) AS value
            FROM #{concise_table_name}
            GROUP BY
              person_id,
              event_id,
              continent_id,
              country_id
            WITH ROLLUP
            HAVING event_id IS NOT NULL
              AND person_id IS NOT NULL
          ),
          current_persons AS (
            SELECT
              wca_id,
              country_id,
              countries.continent_id
            FROM persons
              INNER JOIN countries ON persons.country_id = countries.id
            WHERE persons.sub_id = 1
          ),
          world_ranks AS (
            SELECT person_id, event_id, value,
              RANK() OVER (PARTITION BY event_id ORDER BY value) AS world_rank
            FROM personal_bests
            WHERE continent_id IS NULL
              AND country_id IS NULL
          ),
          continent_ranks AS (
            SELECT person_id, event_id, continent_id, value,
              RANK() OVER (PARTITION BY event_id, continent_id ORDER BY value) AS continent_rank
            FROM personal_bests
            WHERE country_id IS NULL
              AND continent_id IS NOT NULL
          ),
          country_ranks AS (
            SELECT person_id, event_id, country_id, value,
              RANK() OVER (PARTITION BY event_id, country_id ORDER BY value) AS country_rank
            FROM personal_bests
            WHERE country_id IS NOT NULL
          )
          SELECT
            cp.wca_id AS person_id,
            wr.event_id,
            wr.value AS best,
            wr.world_rank AS world_rank,
            COALESCE(cr.continent_rank, 0) AS continent_rank,
            COALESCE(nr.country_rank, 0) AS country_rank
          FROM current_persons cp
          INNER JOIN world_ranks wr
            ON cp.wca_id = wr.person_id
          LEFT JOIN continent_ranks cr
            ON cp.wca_id = cr.person_id
              AND wr.event_id = cr.event_id
              AND cp.continent_id = cr.continent_id
          LEFT JOIN country_ranks nr
            ON cp.wca_id = nr.person_id
              AND wr.event_id = nr.event_id
              AND cp.country_id = nr.country_id
          ORDER BY
            wr.event_id,
            world_rank
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
