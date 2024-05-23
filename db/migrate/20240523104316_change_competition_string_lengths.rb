# frozen_string_literal: true

class ChangeCompetitionStringLengths < ActiveRecord::Migration[7.1]
  def change
    change_table :Competitions do |t|
      t.change :venueAddress, :string
      t.change :venueDetails, :string
    end
  end
end
