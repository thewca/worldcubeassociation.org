# frozen_string_literal: true

class CreateTicketsEditPerson < ActiveRecord::Migration[7.2]
  def change
    create_table :tickets_edit_person do |t|
      t.string :status, null: false
      t.string :wca_id, null: false
      t.string :previous_name
      t.string :new_name
      t.date :previous_dob
      t.date :new_dob
      t.string :previous_country_iso2
      t.string :new_country_iso2
      t.string :previous_gender
      t.string :new_gender
      t.timestamps
    end
  end
end
