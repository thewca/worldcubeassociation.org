# frozen_string_literal: true

class RemoveEventSpecsFromCompetitions < ActiveRecord::Migration
  def change
    remove_column :Competitions, :eventSpecs
  end
end
