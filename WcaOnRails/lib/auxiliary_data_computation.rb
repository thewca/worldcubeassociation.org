# frozen_string_literal: true

module AuxiliaryDataComputation
  def self.compute_everything
    self.compute_concise_results
    self.compute_rank_tables

    self.delete_cached_results
  end

  ## Build 'concise results' tables.
  def self.compute_concise_results
    [
      %w(best ConciseSingleResults),
      %w(average ConciseAverageResults),
    ].each do |field, table_name|
      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute "DELETE FROM #{table_name}"
        ActiveRecord::Base.connection.execute <<-SQL
          INSERT INTO #{table_name} (id, #{field}, valueAndId, personId, eventId, countryId, continentId, year, month, day)
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
              WHERE #{field} > 0
              GROUP BY personId, result.countryId, eventId, year
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
      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute "DELETE FROM #{table_name}"
        current_country_by_wca_id = Person.current.pluck(:wca_id, :countryId).to_h
        # Get all personal records (note: people that changed their country appear once for each country).
        personal_records_with_event = ActiveRecord::Base.connection.execute <<-SQL
          SELECT eventId, personId, countryId, continentId, min(#{field}) value
          FROM #{concise_table_name}
          GROUP BY personId, countryId, continentId, eventId
          ORDER BY eventId, value
        SQL
        personal_records_with_event.group_by(&:first).each do |event_id, personal_records|
          personal_rank = Hash.new { |h, k| h[k] = {} }
          ranked = Hash.new { |h, k| h[k] = {} }
          counter = Hash.new(0)
          current_rank = Hash.new(0)
          previous_value = {}
          personal_records.each do |_, person_id, country_id, continent_id, value|
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
            cached_country = Country.c_find(current_country_by_wca_id[person_id])
            # The only known case where this happens if current_country_by_wca_id[person_id] is nil,
            # in other words, the personId from the Concise*Results table is not found in the Persons table.
            # In the past, this has occurred when temporary results have been inserted for newcomers.
            next if cached_country.nil?
            # Set the person's data (first time the current location is matched).
            personal_rank[person_id][:best] ||= value
            personal_rank[person_id][:world_rank] ||= current_rank["World"]
            if continent_id == cached_country.continentId
              personal_rank[person_id][:continent_rank] ||= current_rank[continent_id]
            end
            if country_id == cached_country.id
              personal_rank[person_id][:country_rank] ||= current_rank[country_id]
            end
          end
          values = personal_rank.map do |person_id, rank_data|
            # NOTE: continent_rank and country_rank may be not present because of a country change, in such case we default to 0.
            "('#{person_id}', '#{event_id}', #{rank_data[:best]}, #{rank_data[:world_rank]}, #{rank_data[:continent_rank] || 0}, #{rank_data[:country_rank] || 0})"
          end
          # Insert 500 rows at once to avoid running into too long query.
          values.each_slice(500) do |values_subset|
            ActiveRecord::Base.connection.execute <<-SQL
              INSERT INTO #{table_name} (personId, eventId, best, worldRank, continentRank, countryRank) VALUES
              #{values_subset.join(",\n")}
            SQL
          end
        end
      end
    end
  end

  def self.delete_cached_results
    # By deleting existing results, they can be cached again on the first execution
    CachedResult.delete_all
  end
end
