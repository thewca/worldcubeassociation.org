# frozen_string_literal: true

class AddMockH2HToRoundTable < ActiveRecord::Migration[7.2]
  def change
    add_column :rounds, :is_h2h_mock, :boolean, default: false, null: false
  end
end
