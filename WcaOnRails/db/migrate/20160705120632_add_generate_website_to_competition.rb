# frozen_string_literal: true

class AddGenerateWebsiteToCompetition < ActiveRecord::Migration
  def change
    add_column :Competitions, :generate_website, :boolean
  end
end
