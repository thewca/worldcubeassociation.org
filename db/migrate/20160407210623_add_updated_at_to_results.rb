# frozen_string_literal: true

class AddUpdatedAtToResults < ActiveRecord::Migration
  def up
    execute "ALTER TABLE Results ADD updated_at timestamp NOT NULL default now() on update now();"
    add_index :Results, [:competitionId, :updated_at]

    Competition.find_each do |c|
      propably_updated_at = c.end_date
      c.results.update_all(updated_at: propably_updated_at)
    end
  end

  def down
    remove_index :Results, [:competitionId, :updated_at]
    remove_column :Results, :updated_at
  end
end
