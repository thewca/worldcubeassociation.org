# frozen_string_literal: true

class RemoveOrganiserPasswordAndAdminPasswordFromCompetitions < ActiveRecord::Migration
  def change
    remove_column :Competitions, :organiserPassword, :string
    remove_column :Competitions, :adminPassword, :string
  end
end
