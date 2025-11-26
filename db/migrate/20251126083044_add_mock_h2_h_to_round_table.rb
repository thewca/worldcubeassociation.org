# frozen_string_literal: true

class AddMockH2HToRoundTable < ActiveRecord::Migration[7.2]
  def change
    add_column :rounds, :mock_h2h, :boolean, default: false, null: false
  end
end
