# frozen_string_literal: true

class AddFulltextIndexOnPersonsName < ActiveRecord::Migration[5.1]
  def change
    add_index(:Persons, :name, type: :fulltext)
  end
end
