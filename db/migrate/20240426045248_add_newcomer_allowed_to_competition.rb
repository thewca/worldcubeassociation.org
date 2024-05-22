# frozen_string_literal: true

class AddNewcomerAllowedToCompetition < ActiveRecord::Migration[7.1]
  def change
    add_column :Competitions, :forbid_newcomers, :boolean, default: false, null: false
    add_column :Competitions, :forbid_newcomers_reason, :string
  end
end
