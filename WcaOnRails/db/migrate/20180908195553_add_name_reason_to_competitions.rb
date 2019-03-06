# frozen_string_literal: true

class AddNameReasonToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :name_reason, :string
  end
end
