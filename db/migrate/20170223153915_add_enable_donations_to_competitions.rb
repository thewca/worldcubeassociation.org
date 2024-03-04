# frozen_string_literal: true

class AddEnableDonationsToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :enable_donations, :boolean
  end
end
