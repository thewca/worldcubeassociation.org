# frozen_string_literal: true

class AddScramblesMatcherTables < ActiveRecord::Migration[7.2]
  def change
    create_table :scramble_file_uploads do |t|
      t.references :user, type: :integer, foreign_key: true, null: false
      t.timestamp :uploaded_at, null: false
      t.references :competition, type: :string, null: false
      t.string :scramble_program
      t.timestamp :generated_at
      t.text :raw_wcif, null: false, size: :long
      t.timestamps
    end

    rename_column :scramble_file_uploads, :user_id, :uploaded_by

    create_table :inbox_scramble_sets do |t|
      t.references :competition, type: :string, null: false
      t.references :event, type: :string, null: false, foreign_key: true, index: false
      t.references :round_type, type: :string, null: false, foreign_key: true, index: false
      t.integer :ordered_index, null: false
      t.references :matched_round, type: :integer, foreign_key: { to_table: :rounds }
      t.references :external_upload, foreign_key: { to_table: :scramble_file_uploads }
      t.timestamps

      t.index %i[competition_id event_id round_type_id]
      t.index %i[competition_id event_id round_type_id ordered_index], unique: true
    end

    create_table :inbox_scrambles do |t|
      t.references :inbox_scramble_set, foreign_key: true, null: false
      t.boolean :is_extra, null: false, default: false
      t.integer :scramble_number, null: false
      t.text :scramble_string, null: false
      t.timestamps

      t.index %i[inbox_scramble_set_id scramble_number is_extra], unique: true
    end
  end
end
