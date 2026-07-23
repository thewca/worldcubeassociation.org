# frozen_string_literal: true

class RemoveRedundantKeyPacking < ActiveRecord::Migration[8.1]
  def up
    execute "ALTER TABLE events PACK_KEYS=DEFAULT"
    execute "ALTER TABLE inbox_results PACK_KEYS=DEFAULT"
    execute "ALTER TABLE results PACK_KEYS=DEFAULT"
  end

  def down
    execute "ALTER TABLE events PACK_KEYS=0"
    execute "ALTER TABLE inbox_results PACK_KEYS=0"
    execute "ALTER TABLE results PACK_KEYS=1"
  end
end
