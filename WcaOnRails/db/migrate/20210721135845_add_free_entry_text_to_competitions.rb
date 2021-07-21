# frozen_string_literal: true

class AddFreeEntryTextToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :free_entry_text, :string, null: false, default: "none"
  end
end
