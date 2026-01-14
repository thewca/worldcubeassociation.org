# rubocop:disable Rails/BulkChangeTable
# rubocop:disable Rails/DangerousColumnNames
# frozen_string_literal: true

class AddAutoIncrementToCompetitions < ActiveRecord::Migration[7.1]
  def up
    remove_foreign_key :tickets_competition_result, :competitions

    execute "ALTER TABLE competitions DROP PRIMARY KEY"

    rename_column :competitions, :id, :competition_id
    add_index :competitions, :competition_id, unique: true

    add_column :competitions, :stable_id, :bigint, first: true

    execute "UPDATE competitions c, (SELECT competition_id, ROW_NUMBER() OVER (ORDER BY created_at, announced_at, start_date, competition_id) AS rn FROM competitions) h SET c.stable_id = h.rn WHERE c.competition_id = h.competition_id"
    change_column :competitions, :stable_id, :primary_key, auto_increment: true
  end

  def down
    change_column :competitions, :stable_id, :integer, auto_increment: false
    execute "ALTER TABLE competitions DROP PRIMARY KEY"

    remove_column :competitions, :stable_id, :primary_key

    remove_index :competitions, :competition_id
    rename_column :competitions, :competition_id, :id

    execute "ALTER TABLE competitions ADD PRIMARY KEY(id)"

    add_foreign_key :tickets_competition_result, :competitions
  end
end
# rubocop:enable all
