# frozen_string_literal: true

class CreateCompetitionSeriesTable < ActiveRecord::Migration[6.1]
  def change
    create_table :competition_series do |t|
      t.string :wcif_id
      t.string :name
      t.string :short_name
      t.timestamps
    end

    add_column :Competitions, :competition_series_id, :integer, null: true, default: nil
  end
end
