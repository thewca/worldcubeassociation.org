# frozen_string_literal: true

class CreateCachedResults < ActiveRecord::Migration[6.1]
  def change
    create_table :cached_results, id: false, :primary_key => :key do |t|
      t.string :key
      t.json :payload
      t.timestamps
    end
  end
end
