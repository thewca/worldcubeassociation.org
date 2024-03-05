# frozen_string_literal: true

class AddCancelledAtToCompetition < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :cancelled_at, :datetime, null: true, default: nil
    add_column :Competitions, :cancelled_by, :integer, null: true, default: nil
    add_index :Competitions, :cancelled_at
  end
end
