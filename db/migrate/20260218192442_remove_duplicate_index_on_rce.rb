# frozen_string_literal: true

class RemoveDuplicateIndexOnRce < ActiveRecord::Migration[8.1]
  def change
    remove_index :registration_competition_events, %i[registration_id competition_event_id], name: "index_reg_events_reg_id_comp_event_id"
  end
end
