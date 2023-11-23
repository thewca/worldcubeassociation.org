# frozen_string_literal: true

class CreateWfcDuesRedirects < ActiveRecord::Migration[7.0]
  def change
    create_table :wfc_dues_redirects do |t|
      t.string :redirect_source_id, polymorphic: true, null: false
      t.string :redirect_source_type, polymorphic: true, null: false
      t.references :redirect_to, foreign_key: { to_table: :wfc_xero_users }, null: false
      t.timestamps
    end
  end
end
