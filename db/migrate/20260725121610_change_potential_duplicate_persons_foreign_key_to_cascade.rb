# frozen_string_literal: true

class ChangePotentialDuplicatePersonsForeignKeyToCascade < ActiveRecord::Migration[8.1]
  def up
    remove_foreign_key :potential_duplicate_persons, column: :duplicate_person_id
    add_foreign_key :potential_duplicate_persons, :persons, column: :duplicate_person_id, on_delete: :cascade
  end

  def down
    remove_foreign_key :potential_duplicate_persons, column: :duplicate_person_id
    add_foreign_key :potential_duplicate_persons, :persons, column: :duplicate_person_id
  end
end
