# frozen_string_literal: true

class MakeAssignmentsTableRegistrationPolymorphic < ActiveRecord::Migration[7.1]
  def change
    add_column :assignments, :registration_type, :string, after: :registration_id

    remove_index :assignments, column: :registration_id
    add_index :assignments, [:registration_id, :registration_type]

    Assignment.update_all(registration_type: 'Registration')
  end
end
