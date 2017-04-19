# frozen_string_literal: true

class RemoveResultsStatus < ActiveRecord::Migration
  def change
    drop_table :ResultsStatus
  end
end
