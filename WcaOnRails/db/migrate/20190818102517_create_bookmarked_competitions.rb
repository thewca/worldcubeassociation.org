# frozen_string_literal: true

class CreateBookmarkedCompetitions < ActiveRecord::Migration[5.2]
  def change
    create_table :bookmarked_competitions do |t|
      t.string :competition_id, null: false
      t.integer :user_id, null: false
      t.timestamps
    end
    add_index :bookmarked_competitions, :competition_id
    add_index :bookmarked_competitions, :user_id
    add_index :bookmarked_competitions, [:competition_id, :user_id]

    add_column :Competitions, :registration_reminder_sent_at, :datetime, null: true, default: nil
  end
end
