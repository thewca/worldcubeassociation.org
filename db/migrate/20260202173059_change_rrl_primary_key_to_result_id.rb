# frozen_string_literal: true

class ChangeRrlPrimaryKeyToResultId < ActiveRecord::Migration[8.1]
  # rubocop:disable Rails/BulkChangeTable, Rails/DangerousColumnNames
  def up
    remove_column :regional_records_lookup, :id

    execute "ALTER TABLE `regional_records_lookup` ADD PRIMARY KEY (result_id)"

    remove_index :regional_records_lookup, :result_id
  end

  def down
    execute "ALTER TABLE `regional_records_lookup` DROP PRIMARY KEY"

    add_column :regional_records_lookup, :id, :primary_key, first: true
    add_index :regional_records_lookup, :result_id
  end
  # rubocop:enable all
end
