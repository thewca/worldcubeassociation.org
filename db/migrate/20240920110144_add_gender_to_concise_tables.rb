# frozen_string_literal: true

class AddGenderToConciseTables < ActiveRecord::Migration[7.2]
  def change
    add_column :ConciseSingleResults, :gender, :string, limit: 1, default: ""
    add_column :ConciseAverageResults, :gender, :string, limit: 1, default: ""
  end
end
