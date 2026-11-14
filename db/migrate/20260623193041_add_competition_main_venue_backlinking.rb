# frozen_string_literal: true

class AddCompetitionMainVenueBacklinking < ActiveRecord::Migration[8.1]
  def change
    change_table :competitions, bulk: true do |t|
      t.references :main_venue, null: true, after: :main_event_id, foreign_key: { to_table: :competition_venues, on_update: :cascade, on_delete: :nullify }
      t.boolean :is_multi_location, null: false, default: false, after: :main_venue_id
    end
  end
end
