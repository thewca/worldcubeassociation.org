# frozen_string_literal: true

class AddConfirmedAtToCompetitions < ActiveRecord::Migration[5.2]
  def up
    add_column :Competitions, :confirmed_at, :datetime
    execute <<-SQL
      UPDATE Competitions
      SET confirmed_at = announced_at
      WHERE announced_at IS NOT NULL
    SQL
    execute <<-SQL
      UPDATE Competitions
      SET confirmed_at = NOW()
      WHERE isConfirmed = 1 AND confirmed_at IS NULL
    SQL
    remove_column :Competitions, :isConfirmed
  end

  def down
    add_column :Competitions, :isConfirmed, :boolean, default: false, null: false
    execute <<-SQL
      UPDATE Competitions
      SET isConfirmed = 1
      WHERE confirmed_at IS NOT NULL
    SQL
    remove_column :Competitions, :confirmed_at
  end
end
