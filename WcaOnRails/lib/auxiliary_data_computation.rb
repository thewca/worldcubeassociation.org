# frozen_string_literal: true

module AuxiliaryDataComputation

  def self.compute_everything
    self.compute_best_of_3_in_333bf
    self.compute_concise_results
    self.compute_rank_tables
  end

  ## Compute mean for 'best of 3' results in 333bf.
  def self.compute_best_of_3_in_333bf
    # Set new DNF average where any of three solves is not completed.
    Result.where(eventId: "333bf", formatId: "3", average: 0)
          .where("LEAST(value1, value2, value3) < 0")
          .where.not(value1: 0, value2: 0, value3: 0)
          .update_all(average: -1)
    # Set new averages (round times > 10:00).
    Result.where(eventId: "333bf", formatId: "3", average: 0)
          .where("LEAST(value1, value2, value3) > 0")
          .update_all <<-SQL
            average = IF(
              (value1 + value2 + value3)/3.0 > 60000,
              (value1 + value2 + value3)/3.0 - MOD((value1 + value2 + value3)/3.0, 100),
              (value1 + value2 + value3)/3.0
            )
          SQL
  end

  ## Build 'concise results' tables.
  def self.compute_concise_results
    [
      %w(best ConciseSingleResults),
      %w(average ConciseAverageResults),
    ].each do |field, table_name|
      ActiveRecord::Base.connection.execute "DROP TABLE IF EXISTS #{table_name}"
      ActiveRecord::Base.connection.execute <<-SQL
        CREATE TABLE #{table_name}
        SELECT
          result.id,
          #{field},
          valueAndId,
          personId,
          eventId,
          country.id countryId,
          continentId,
          year, month, day
        FROM (
            SELECT MIN(#{field} * 1000000000 + result.id) valueAndId
            FROM Results result
            JOIN Competitions competition ON competition.id = competitionId
            JOIN Events event ON event.id = eventId AND event.rank < 990
            WHERE #{field} > 0
            GROUP BY personId, result.countryId, eventId, year
          ) MinValuesWithId
          JOIN Results result ON result.id = valueAndId % 1000000000
          JOIN Competitions competition ON competition.id = competitionId
          JOIN Countries country ON country.id = result.countryId
      SQL
    end
  end

  ## Build rank tables.
  def self.compute_rank_tables
    [
      %w(best RanksSingle ConciseSingleResults),
      %w(average RanksAverage ConciseAverageResults),
    ].each do |field, table_name, concise_table_name|
      ActiveRecord::Base.connection.execute "TRUNCATE TABLE #{table_name}"
      current_country = Person.current.pluck(:wca_id, :countryId).to_h
      current_continent = Hash.new do |hash, person_id|
        hash[person_id] = Country.c_find(current_country[person_id]).continentId
      end
      # Get all personal records (note: people that changed their country appear once for each country).
      personal_records_with_event = ActiveRecord::Base.connection.execute <<-SQL
        SELECT eventId, personId, countryId, continentId, min(#{field}) value
        FROM #{concise_table_name}
        WHERE eventId <> '333mbo'
        GROUP BY personId, countryId, continentId, eventId
        ORDER BY eventId, value
      SQL
      personal_records_with_event.group_by(&:first).each do |event_id, personal_records|
        personal_rank = Hash.new { |h, k| h[k] = {} }
        ranked = Hash.new { |h, k| h[k] = {} }
        counter = Hash.new(0)
        current_rank = Hash.new(0)
        previous_value = {}
        personal_records.each do |event_id, person_id, country_id, continent_id, value|
          # Update the region states (unless we have ranked this person already,
          # e.g. 2008SEAR01 twice in North America and World because of his two countries).
          ["World", continent_id, country_id].each do |region|
            next if ranked[region][person_id]
            counter[region] += 1
            # As we ordered by value it can either be greater or tie the previous one.
            current_rank[region] = counter[region] if previous_value[region].nil? || value > previous_value[region]
            previous_value[region] = value
            ranked[region][person_id] = true
          end
          # Set the person's data (first time the current location is matched).
          personal_rank[person_id][:best] ||= value
          personal_rank[person_id][:world_rank] ||= current_rank["World"]
          if continent_id == current_continent[person_id]
            personal_rank[person_id][:continent_rank] ||= current_rank[continent_id]
          end
          if country_id == current_country[person_id]
            personal_rank[person_id][:country_rank] ||= current_rank[country_id]
          end
        end
        values = personal_rank.map do |person_id, rank_data|
          # Note: continent_rank and country_rank may be not present because of a country change, in such case we default to 0.
          "('#{person_id}', '#{event_id}', #{rank_data[:best]}, #{rank_data[:world_rank]}, #{rank_data[:continent_rank] || 0}, #{rank_data[:country_rank] || 0})"
        end.join(",\n")
        ActiveRecord::Base.connection.execute <<-SQL
          INSERT INTO #{table_name} (personId, eventId, best, worldRank, continentRank, countryRank) VALUES
          #{values}
        SQL
      end
    end
  end
end
