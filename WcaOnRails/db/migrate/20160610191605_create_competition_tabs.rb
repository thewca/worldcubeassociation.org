# frozen_string_literal: true

class CreateCompetitionTabs < ActiveRecord::Migration
  def change
    create_table :competition_tabs do |t|
      t.string :competition_id

      t.string :name
      t.text :content
    end
  end
end
