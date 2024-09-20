# frozen_string_literal: true

class ChangeDefaultForUsesV2Registrations < ActiveRecord::Migration[7.2]
  def change
    change_column_default :Competitions, :uses_v2_registrations, true
  end
end
