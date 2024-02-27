# frozen_string_literal: true

class AddFieldsToCompetitionsTable < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :announced_by, :integer, null: true, default: nil
    add_column :Competitions, :results_posted_by, :integer, null: true, default: nil
    add_column :Competitions, :main_event_id, :string, null: true, default: nil
  end
end
