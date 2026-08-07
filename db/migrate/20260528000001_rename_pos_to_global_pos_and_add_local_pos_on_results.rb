# frozen_string_literal: true

class RenamePosToGlobalPosAndAddLocalPosOnResults < ActiveRecord::Migration[8.1]
  def up
    add_column :results, :global_pos, :integer, limit: 2, default: 0, null: false, after: :pos
    add_column :inbox_results, :global_pos, :integer, limit: 2, default: 0, null: false, after: :pos
    execute "UPDATE results SET global_pos = pos"
    execute "UPDATE inbox_results SET global_pos = pos"
  end

  def down
    remove_column :results, :global_pos
  end
end
