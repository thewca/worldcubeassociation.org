# frozen_string_literal: true

class CreateTicketsEditPersonFields < ActiveRecord::Migration[7.2]
  def change
    create_table :tickets_edit_person_fields do |t|
      t.references :tickets_edit_person, null: false
      t.string :field_name, null: false
      t.text :old_value, null: false
      t.text :new_value, null: false
      t.timestamps
    end
  end
end
