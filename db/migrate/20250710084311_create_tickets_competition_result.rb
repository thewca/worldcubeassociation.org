# frozen_string_literal: true

class CreateTicketsCompetitionResult < ActiveRecord::Migration[7.2]
  def change
    create_table :tickets_competition_result do |t|
      t.string :status, null: false
      t.references :competition, null: false, type: :string, foreign_key: true
      t.text :delegate_message, null: false

      t.timestamps
    end
  end
end
