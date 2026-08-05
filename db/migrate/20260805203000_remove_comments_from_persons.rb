# frozen_string_literal: true

class RemoveCommentsFromPersons < ActiveRecord::Migration[8.1]
  def change
    remove_column :persons, :comments, :string, limit: 40, default: "", null: false
  end
end
