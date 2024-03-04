# frozen_string_literal: true

class RemoveOrganiserAndWcaDelegateFromCompetitions < ActiveRecord::Migration
  def change
    remove_column :Competitions, :organiser, :text
    remove_column :Competitions, :wcaDelegate, :text
  end
end
