# frozen_string_literal: true

class RenamePosToGlobalPosAndAddLocalPosOnResults < ActiveRecord::Migration[8.1]
  def up
    rename_column :results, :pos, :local_pos
    add_column :results, :global_pos, :integer, limit: 2, default: 0, null: false
    execute "UPDATE results SET global_pos = local_pos"
  end

  def down
    remove_column :results, :global_pos
    rename_column :results, :local_pos, :pos
  end
end
