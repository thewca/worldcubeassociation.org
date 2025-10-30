# frozen_string_literal: true

class RemoveValueN < ActiveRecord::Migration[7.2]
  def change
    remove_column :results, :value1, :integer
    remove_column :results, :value2, :integer
    remove_column :results, :value3, :integer
    remove_column :results, :value4, :integer
    remove_column :results, :value5, :integer
  end
end
