# frozen_string_literal: true

class CreateWaitingList < ActiveRecord::Migration[7.2]
  def change
    create_table :waiting_lists do |t|
      t.references :holder, polymorphic: true
      t.json :entries

      t.timestamps
    end
  end
end
