# frozen_string_literal: true

class ChangeFkCascadingOnLiveResults < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :live_results, :rounds
    add_foreign_key :live_results, :rounds, on_delete: :cascade
  end
end
