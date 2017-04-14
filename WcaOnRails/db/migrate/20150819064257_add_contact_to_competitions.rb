# frozen_string_literal: true

class AddContactToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :contact, :string
  end
end
