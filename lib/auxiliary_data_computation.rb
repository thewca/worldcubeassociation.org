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
          WITH best_per_region AS (
            SELECT event_id, person_id, country_id, continent_id, MIN(#{field}) `value`
            FROM #{concise_table_name}
            GROUP BY person_id, country_id, continent_id, event_id
          ), personal_bests AS (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id, person_id ORDER BY value) AS really_best
            FROM best_per_region
          )
          SELECT
            person_id, event_id, `value`,
            RANK() OVER(PARTITION BY event_id ORDER BY `value`) AS world_rank,
            RANK() OVER(PARTITION BY event_id, continent_id ORDER BY `value`) AS continent_rank,
            RANK() OVER(PARTITION BY event_id, country_id ORDER BY `value`) AS country_rank
          FROM personal_bests
          WHERE really_best = 1
          ORDER BY event_id, `value`
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
