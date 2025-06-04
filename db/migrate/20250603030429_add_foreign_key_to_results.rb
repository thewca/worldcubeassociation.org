# frozen_string_literal: true

class AddForeignKeyToResults < ActiveRecord::Migration[7.2]
  def change
    add_foreign_key :results, :rounds
    add_foreign_key :scrambles, :rounds
  end
end
