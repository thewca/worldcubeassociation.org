# frozen_string_literal: true

class ChangeForeignKeyCascadeOnPostingTickets < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :tickets_competition_result, :competitions
    add_foreign_key :tickets_competition_result, :competitions, on_delete: :cascade, on_update: :cascade
  end
end
