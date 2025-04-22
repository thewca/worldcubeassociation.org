# frozen_string_literal: true

class RenameScrambleTables < ActiveRecord::Migration[7.2]
  def change
    change_table :Scrambles, bulk: true do |t|
      # Intentionally rename it to the conventional id field
      # rubocop:disable Rails/DangerousColumnNames
      t.rename :scrambleId, :id
      # rubocop:enable Rails/DangerousColumnNames
      t.rename :competitionId, :competition_id
      t.rename :eventId, :event_id
      t.rename :roundTypeId, :round_type_id
      t.rename :groupId, :group_id
      t.rename :isExtra, :is_extra
      t.rename :scrambleNum, :scramble_num
    end

    rename_table :Scrambles, :scrambles
  end
end
