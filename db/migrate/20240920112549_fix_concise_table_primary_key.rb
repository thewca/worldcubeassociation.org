# frozen_string_literal: true

class FixConciseTablePrimaryKey < ActiveRecord::Migration[7.2]
  def change
    # First, make it have a PRIMARY KEY in the first place
    #   (which in case of Rails 7, defaults to `BIGINT`)
    change_column :ConciseSingleResults, :id, :primary_key
    change_column :ConciseAverageResults, :id, :primary_key

    # and then change that newly created key to be an `INTEGER` instead
    #   (which is consistent with the Results and Ranks tables)
    change_column :ConciseSingleResults, :id, :integer
    change_column :ConciseAverageResults, :id, :integer
  end
end
