# rubocop:disable all
# frozen_string_literal: true

class AddAutoAcceptToCompetitionsTable < ActiveRecord::Migration[7.2]
  def change
    add_column :Competitions, :auto_accept_registrations, :boolean, default: false, null: false
    add_column :Competitions, :auto_accept_disable_threshold, :integer
  end
end
