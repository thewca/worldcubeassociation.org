# frozen_string_literal: true

module AuxiliaryDataComputation
  def self.compute_everything(competition_id = nil)
    self.insert_regional_records_lookup(competition_id)
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
          INSERT INTO #{temp_table_name} (id, #{field}, value_and_id, person_id, event_id, country_id, continent_id, year)
          WITH concise_agg AS (
            SELECT MIN(#{field} * 1000000000 + result_id) value_and_id
            FROM regional_records_lookup
            WHERE #{field} > 0
            GROUP BY person_id, country_id, event_id, competition_year
          )
          SELECT
            rll.result_id id,
            rll.#{field},
            concise_agg.value_and_id,
            rll.person_id,
            rll.event_id,
            rll.country_id,
            countries.continent_id,
            rll.competition_year `year`
          FROM concise_agg
            INNER JOIN regional_records_lookup rll ON rll.result_id = (value_and_id % 1000000000)
            INNER JOIN countries ON countries.id = rll.country_id
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
        current_country_by_wca_id = Person.current.pluck(:wca_id, :country_id).to_h
        # Get all personal records (note: people that changed their country appear once for each country).
        personal_records_with_event = ActiveRecord::Base.connection.execute <<~SQL.squish
          SELECT event_id, person_id, country_id, continent_id, MIN(#{field}) value
          FROM #{concise_table_name}
          GROUP BY person_id, country_id, continent_id, event_id
          ORDER BY event_id, value
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
            # in other words, the person_id from the concise*results table is not found in the Persons table.
            # In the past, this has occurred when temporary results have been inserted for newcomers.
            next if cached_country.nil?

            # Set the person's data (first time the current location is matched).
            personal_rank[person_id][:best] ||= value
            personal_rank[person_id][:world_rank] ||= current_rank["World"]
            personal_rank[person_id][:continent_rank] ||= current_rank[continent_id] if continent_id == cached_country.continent_id
            personal_rank[person_id][:country_rank] ||= current_rank[country_id] if country_id == cached_country.id
          end
          values = personal_rank.map do |person_id, rank_data|
            # NOTE: continent_rank and country_rank may be not present because of a country change, in such case we default to 0.
            "('#{person_id}', '#{event_id}', #{rank_data[:best]}, #{rank_data[:world_rank]}, #{rank_data[:continent_rank] || 0}, #{rank_data[:country_rank] || 0})"
          end
          # Insert 500 rows at once to avoid running into too long query.
          values.each_slice(500) do |values_subset|
            ActiveRecord::Base.connection.execute <<~SQL.squish
              INSERT INTO #{temp_table_name} (person_id, event_id, best, world_rank, continent_rank, country_rank) VALUES
              #{values_subset.join(",\n")}
            SQL
          end
        end
      end
    end
  end

  def self.insert_regional_records_lookup(competition_id = nil)
    CheckRegionalRecords.add_to_lookup_table(competition_id)
  end
end
