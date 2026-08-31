# frozen_string_literal: true

class RenameInboxScrambleTables < ActiveRecord::Migration[8.1]
  def change
    rename_table :inbox_scramble_sets, :external_scramble_sets
    rename_table :inbox_scrambles, :external_scrambles

    rename_column :external_scrambles, :inbox_scramble_set_id, :external_scramble_set_id

    change_column_null :external_scramble_sets, :external_upload_id, false

    remove_column :external_scramble_sets, :matched_round_id, :bigint
    remove_column :external_scrambles, :matched_scramble_set_id, :bigint

    remove_column :external_scramble_sets, :ordered_index, :integer, null: false
    remove_column :external_scrambles, :ordered_index, :integer, null: false

    rename_column :external_scramble_sets, :external_upload_id, :scramble_file_upload_id

    add_foreign_key :external_scramble_sets, :competitions

    remove_foreign_key :external_scrambles, :external_scramble_sets
    add_foreign_key :external_scrambles, :external_scramble_sets, on_delete: :cascade

    remove_foreign_key :external_scramble_sets, :scramble_file_uploads
    add_foreign_key :external_scramble_sets, :scramble_file_uploads, on_delete: :cascade
  end
end
