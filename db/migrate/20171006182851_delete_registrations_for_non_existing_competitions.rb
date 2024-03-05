# frozen_string_literal: true

class DeleteRegistrationsForNonExistingCompetitions < ActiveRecord::Migration[5.1]
  def change
    execute <<-SQL
      DELETE registrations.* FROM registrations LEFT JOIN Competitions ON registrations.competition_id=Competitions.id WHERE Competitions.id IS NULL;
    SQL
  end
end
