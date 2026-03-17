# frozen_string_literal: true

module AuxiliaryDataComputation
  def self.compute_everything
    self.insert_regional_records_lookup
    self.compute_concise_results
    self.compute_rank_tables
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
          WITH concise_agg AS (
            SELECT MIN(#{field} * 1000000000 + result_id) value_and_id
            FROM regional_records_lookup
            WHERE #{field} > 0
            GROUP BY person_id, country_id, event_id, competition_reg_year
          )
          SELECT
            rrl.result_id id,
            rrl.#{field},
            concise_agg.value_and_id,
            rrl.person_id,
            rrl.event_id,
            rrl.country_id,
            rrl.continent_id,
            rrl.competition_reg_year `reg_year`
          FROM concise_agg
            INNER JOIN regional_records_lookup rrl ON rrl.result_id = (concise_agg.value_and_id % 1000000000)
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
              INNER JOIN countries c ON p.country_id = c.id
            WHERE p.sub_id = 1
          ),
          personal_bests AS (
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
            HAVING person_id IS NOT NULL
              AND event_id IS NOT NULL
          ),
          world_ranks AS (
            SELECT person_id, event_id, value,
              RANK() OVER (PARTITION BY event_id ORDER BY value) AS world_rank
            FROM personal_bests
            WHERE country_id IS NULL
              AND continent_id IS NULL
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
              AND continent_id IS NOT NULL
          )
          SELECT
            wr.person_id,
            wr.event_id,
            wr.value AS best,
            wr.world_rank,
            COALESCE(cr.continent_rank, 0) AS continent_rank,
            COALESCE(nr.country_rank, 0) AS country_rank
          FROM world_ranks wr
          INNER JOIN current_person_regions cpr
            ON cpr.person_id = wr.person_id
          LEFT JOIN continent_ranks cr
            ON cpr.person_id = cr.person_id
              AND wr.event_id = cr.event_id
              AND cpr.current_continent_id = cr.continent_id
          LEFT JOIN country_ranks nr
            ON cpr.person_id = nr.person_id
              AND wr.event_id = nr.event_id
              AND cpr.current_country_id = nr.country_id
          ORDER BY
            wr.event_id,
            wr.world_rank
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
