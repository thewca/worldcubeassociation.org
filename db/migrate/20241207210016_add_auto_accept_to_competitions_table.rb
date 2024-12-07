# frozen_string_literal: true

class AddAutoAcceptToCompetitionsTable < ActiveRecord::Migration[7.2]
  def change
    # TODO: Ask ChatGPT if these look fine
    add_column :Competitions, :auto_accept_registrations, :boolean, default: false, null: false
    add_column :Competitions, :auto_accept_disable_threshold, :integer, default: 0, null: false # TODO: Add validation that this can't be > competitor_limit
  end
end
