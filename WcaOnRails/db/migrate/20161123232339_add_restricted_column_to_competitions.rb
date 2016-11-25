# frozen_string_literal: true
class AddRestrictedColumnToCompetitions < ActiveRecord::Migration
  def up
    add_column :Competitions, :restricted, :boolean, null: false, default: false
  end
end
