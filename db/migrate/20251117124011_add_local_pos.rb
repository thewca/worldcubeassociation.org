# frozen_string_literal: true

class AddLocalPos < ActiveRecord::Migration[7.2]
  def change
    change_table :live_results, bulk: true do |t|
      t.rename :ranking, :local_pos
      t.integer :global_pos, after: :local_pos
    end
  end
end
