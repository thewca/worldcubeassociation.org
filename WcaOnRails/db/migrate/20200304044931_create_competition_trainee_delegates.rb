# frozen_string_literal: true

class CreateCompetitionTraineeDelegates < ActiveRecord::Migration[5.2]
  def change
    create_table :competition_trainee_delegates do |t|
      t.string :competition_id
      t.integer :trainee_delegate_id
      t.boolean :receive_registration_emails, default: true, null: false

      t.timestamps
    end
    add_index :competition_trainee_delegates, :competition_id
    add_index :competition_trainee_delegates, :trainee_delegate_id
  end
end
