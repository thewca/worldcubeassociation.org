# frozen_string_literal: true

class AddPostingByToCompetition < ActiveRecord::Migration[7.0]
  def change
    add_column :Competitions, :posting_by, :integer, null: true, default: nil
  end
end
