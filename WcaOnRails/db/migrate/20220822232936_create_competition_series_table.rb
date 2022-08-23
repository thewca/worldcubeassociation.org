# frozen_string_literal: true

class CreateCompetitionSeriesTable < ActiveRecord::Migration[6.1]
  def change
    create_table :competition_series do |t|
      t.string :name
      t.timestamps
    end

    add_column :Competitions, :series_id, :integer, null: true, default: nil
  end
end
