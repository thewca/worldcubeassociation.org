# frozen_string_literal: true

class GuestsEnabledByDefault < ActiveRecord::Migration
  def change
    Competition.update_all guests_enabled: true
    reversible do |dir|
      dir.up do
        change_column_default :Competitions, :guests_enabled, true
      end
      dir.down do
        change_column_default :Competitions, :guests_enabled, false
      end
    end
  end
end
