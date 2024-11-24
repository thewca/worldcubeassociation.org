# frozen_string_literal: true

class CreateTicketsEditPersonFields < ActiveRecord::Migration[7.2]
  def change
    create_table :tickets_edit_person_fields do |t|
      t.bigint :tickets_edit_person_id, null: false
      t.string :field_name, null: false
      t.string :old_value, null: false
      t.string :new_value, null: false
      t.timestamps
    end
  end
end
