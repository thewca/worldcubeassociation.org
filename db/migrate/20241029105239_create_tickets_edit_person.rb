# frozen_string_literal: true

class CreateTicketsEditPerson < ActiveRecord::Migration[7.2]
  def change
    create_table :tickets_edit_person do |t|
      t.string :status, null: false
      t.string :wca_id, null: false
      t.timestamps
    end
  end
end
