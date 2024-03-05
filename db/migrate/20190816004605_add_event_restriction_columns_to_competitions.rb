# frozen_string_literal: true

class AddEventRestrictionColumnsToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :event_restrictions, :boolean, null: true, default: nil
    add_column :Competitions, :event_restrictions_reason, :text, null: true, default: nil
  end
end
