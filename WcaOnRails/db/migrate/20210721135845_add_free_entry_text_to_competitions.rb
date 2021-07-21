# frozen_string_literal: true

class AddFreeEntryTextToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :free_entry_text, :string, null: true, default: "none"
  end
end
