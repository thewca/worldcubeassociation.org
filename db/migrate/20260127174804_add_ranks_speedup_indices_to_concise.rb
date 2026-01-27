# frozen_string_literal: true

class AddRanksSpeedupIndicesToConcise < ActiveRecord::Migration[8.1]
  def change
    add_index :persons, :sub_id

    change_table :concise_single_results, bulk: true do |t|
      t.index %i[person_id event_id best], name: "ranks_speedup_world"
      t.index %i[person_id event_id continent_id best], name: "ranks_speedup_continent"
      t.index %i[person_id event_id country_id best], name: "ranks_speedup_country"
    end

    change_table :concise_average_results, bulk: true do |t|
      t.index %i[person_id event_id average], name: "ranks_speedup_world"
      t.index %i[person_id event_id continent_id average], name: "ranks_speedup_continent"
      t.index %i[person_id event_id country_id average], name: "ranks_speedup_country"
    end
  end
end
