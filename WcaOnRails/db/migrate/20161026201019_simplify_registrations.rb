# frozen_string_literal: true

class SimplifyRegistrations < ActiveRecord::Migration
  def up
    execute <<-SQL
      CREATE TABLE old_registrations LIKE registrations;
    SQL

    # To keep things simple, just copy the entire registrations table over to
    # old_registrations.
    execute <<-SQL
      INSERT INTO old_registrations SELECT registrations.* FROM registrations;
    SQL

    # Now delete all the registrations for competitions whose results have already
    # been uploaded.
    execute <<-SQL
      DELETE registrations.*
      FROM registrations
      JOIN Competitions on Competitions.id=registrations.competitionId
      WHERE Competitions.results_posted_at IS NOT NULL;
    SQL

    rename_column :registrations, :competitionId, :competition_id
    remove_columns :registrations,
                   :name,
                   :personId,
                   :countryId,
                   :gender,
                   :birthYear,
                   :birthMonth,
                   :birthDay,
                   :email,
                   :guests_old
  end

  def down
    drop_table :registrations
    rename_table :old_registrations, :registrations
  end
end
