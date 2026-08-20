# frozen_string_literal: true

class ConciseTableUniquenessKey < ActiveRecord::Migration[8.1]
  def change
    add_index :concise_single_results, %i[person_id country_id event_id reg_year], unique: true, name: 'unique_per_competitor_per_event_per_year'
    add_index :concise_average_results, %i[person_id country_id event_id reg_year], unique: true, name: 'unique_per_competitor_per_event_per_year'
  end
end
