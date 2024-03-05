# frozen_string_literal: true

class CreateWcifExtensions < ActiveRecord::Migration[5.2]
  def change
    create_table :wcif_extensions do |t|
      t.references :extendable, polymorphic: true
      t.string :extension_id, null: false
      t.string :spec_url, null: false
      t.text :data, null: false
    end
  end
end
