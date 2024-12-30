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
      %w(best ConciseSingleResults),
      %w(average ConciseAverageResults),
    ].each do |field, table_name|
      DbHelper.with_temp_table(table_name) do |temp_table_name|
        ActiveRecord::Base.connection.execute <<-SQL
          INSERT INTO #{temp_table_name} (id, #{field}, valueAndId, personId, eventId, countryId, continentId, year, month, day)
          SELECT
            result.id,
            #{field},
            valueAndId,
            personId,
            eventId,
            country.id countryId,
            continentId,
            YEAR(start_date),
            MONTH(start_date),
            DAY(start_date)
          FROM (
              SELECT MIN(#{field} * 1000000000 + result.id) valueAndId
              FROM Results result
              JOIN Competitions competition ON competition.id = competitionId
              WHERE #{field} > 0
              GROUP BY personId, result.countryId, eventId, YEAR(start_date)
            ) MinValuesWithId
            JOIN Results result ON result.id = valueAndId % 1000000000
            JOIN Competitions competition ON competition.id = competitionId
            JOIN Countries country ON country.id = result.countryId
            JOIN Events event ON event.id = eventId
        SQL
      end
    end
  end

  ## Build rank tables.
  def self.compute_rank_tables
    [
      %w(best RanksSingle ConciseSingleResults),
      %w(average RanksAverage ConciseAverageResults),
    ].each do |field, table_name, concise_table_name|
      DbHelper.with_temp_table(table_name) do |temp_table_name|
        ActiveRecord::Base.connection.execute <<-SQL
          INSERT INTO #{temp_table_name} (personId, eventId, best, worldRank, continentRank, countryRank)
          WITH personal_best AS (
            SELECT eventId, personId, countryId, continentId, min(#{field}) `value`
            FROM #{concise_table_name}
            GROUP BY personId, countryId, continentId, eventId
          )
          SELECT
            personId, eventId, `value`,
            RANK() OVER(PARTITION BY eventId ORDER BY `value`) AS worldRank,
            RANK() OVER(PARTITION BY eventId, continentId ORDER BY `value`) AS continentRank,
            RANK() OVER(PARTITION BY eventId, countryId ORDER BY `value`) AS countryRank
          FROM personal_best
          ORDER BY eventId, `value`
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
