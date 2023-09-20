# frozen_string_literal: true

class RecomputePersonsTableIndices < ActiveRecord::Migration[7.0]
  def change
    remove_index :Persons, name: :Persons_id
    remove_index :Persons, name: :index_Persons_on_wca_id_and_subId

    add_index :Persons, :wca_id
    add_index :Persons, [:wca_id, :subId], unique: true
  end
end
