# frozen_string_literal: true

class AddIsCompetingToRegistration < ActiveRecord::Migration[7.0]
  def change
    add_column :registrations, :is_competing, :boolean, default: true
  end
end
