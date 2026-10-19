# frozen_string_literal: true

class CreateWcifRevisions < ActiveRecord::Migration[8.1]
  def change
    create_table :wcif_revisions do |t|
      # No foreign key: Competition#update_foreign_keys rewrites this column when a competition id is renamed.
      t.references :competition, type: :string, null: false, index: false
      t.integer :revision_number, null: false
      t.references :edited_by, null: false, foreign_key: { to_table: :users }
      t.references :oauth_application, type: :integer, foreign_key: { on_delete: :nullify }

      t.timestamps

      t.index %i[competition_id revision_number], unique: true
    end
  end
end
