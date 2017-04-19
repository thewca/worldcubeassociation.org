# frozen_string_literal: true

class ChangeWcaDelegateAndOrganiserToTextInCompetitions < ActiveRecord::Migration
  def up
    change_column :Competitions, :organiser, :text, default: nil, null: true
    change_column :Competitions, :wcaDelegate, :text, default: nil, null: true
  end

  def down
    change_column :Competitions, :organiser, :string, default: nil, null: true
    change_column :Competitions, :wcaDelegate, :string, default: nil, null: true
  end
end
