# frozen_string_literal: true

class ChangePotentialDuplicatePersonsForeignKeyToCascade < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :potential_duplicate_persons, column: :duplicate_person_id
    add_foreign_key :potential_duplicate_persons, :persons, column: :duplicate_person_id, on_delete: :cascade
  end
end
