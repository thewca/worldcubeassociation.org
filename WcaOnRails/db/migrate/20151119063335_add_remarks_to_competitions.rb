# frozen_string_literal: true

class AddRemarksToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :remarks, :text
  end
end
