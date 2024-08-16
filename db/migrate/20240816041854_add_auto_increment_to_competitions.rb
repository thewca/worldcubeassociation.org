# frozen_string_literal: true

class AddAutoIncrementToCompetitions < ActiveRecord::Migration[7.1]
  def up
    remove_foreign_key :microservice_registrations, :Competitions

    execute "ALTER TABLE Competitions DROP PRIMARY KEY"

    rename_column :Competitions, :id, :competition_id
    add_index :Competitions, :competition_id, unique: true

    add_column :Competitions, :id, :bigint, first: true

    execute "UPDATE Competitions c, (SELECT competition_id, ROW_NUMBER() OVER (ORDER BY created_at, announced_at, start_date, competition_id) AS rn FROM Competitions) h SET c.id = h.rn WHERE c.competition_id = h.competition_id"
    change_column :Competitions, :id, :primary_key, auto_increment: true

    add_foreign_key :microservice_registrations, :Competitions, primary_key: :competition_id
  end

  def down
    remove_foreign_key :microservice_registrations, :Competitions

    change_column :Competitions, :id, :integer, auto_increment: false
    execute "ALTER TABLE Competitions DROP PRIMARY KEY"

    remove_column :Competitions, :id, :primary_key

    remove_index :Competitions, :competition_id
    rename_column :Competitions, :competition_id, :id

    execute "ALTER TABLE Competitions ADD PRIMARY KEY(id)"

    add_foreign_key :microservice_registrations, :Competitions
  end
end
