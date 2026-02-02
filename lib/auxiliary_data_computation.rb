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
        ActiveRecord::Base.connection.execute <<~SQL.squish
          INSERT INTO #{temp_table_name} (person_id, event_id, best, world_rank, continent_rank, country_rank)
          WITH current_person_regions AS (
            SELECT
              p.wca_id AS person_id,
              p.country_id AS current_country_id,
              c.continent_id AS current_continent_id
            FROM persons p
            JOIN countries c ON p.country_id = c.id
            WHERE p.sub_id = 1
          ),
          world_stats AS (
            SELECT
              person_id,
              event_id,
              MIN(#{field}) AS world_best
            FROM #{concise_table_name}
            GROUP BY person_id, event_id
          ),
          world_ranks AS (
            SELECT
              person_id,
              event_id,
              world_best,
              RANK() OVER (PARTITION BY event_id ORDER BY world_best) as world_rank
            FROM world_stats
          ),
          continent_stats AS (
            SELECT
              person_id,
              event_id,
              continent_id,
              MIN(#{field}) AS continent_best
            FROM #{concise_table_name}
            GROUP BY person_id, event_id, continent_id
          ),
          continent_ranks AS (
            SELECT
              person_id,
              event_id,
              continent_id,
              RANK() OVER (PARTITION BY continent_id, event_id ORDER BY continent_best) as continent_rank
            FROM continent_stats
          ),
          country_stats AS (
            SELECT
              person_id,
              event_id,
              country_id,
              MIN(#{field}) AS country_best
            FROM #{concise_table_name}
            GROUP BY person_id, event_id, country_id
          ),
          country_ranks AS (
            SELECT
              person_id,
              event_id,
              country_id,
              RANK() OVER (PARTITION BY country_id, event_id ORDER BY country_best) as country_rank
            FROM country_stats
          )
          SELECT
            wr.person_id,
            wr.event_id,
            wr.world_best AS best,
            wr.world_rank,
            COALESCE(cr.continent_rank, 0) AS continent_rank,
            COALESCE(cnr.country_rank, 0) AS country_rank
          FROM world_ranks wr
          INNER JOIN current_person_regions cps
            ON wr.person_id = cps.person_id
          LEFT JOIN continent_ranks cr
            ON wr.person_id = cr.person_id
            AND wr.event_id = cr.event_id
            AND cps.current_continent_id = cr.continent_id
          LEFT JOIN country_ranks cnr
            ON wr.person_id = cnr.person_id
            AND wr.event_id = cnr.event_id
            AND cps.current_country_id = cnr.country_id
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
