# frozen_string_literal: true

class AddLiveAttemptsCountToLiveResults < ActiveRecord::Migration[8.1]
  def change
    add_column :live_results, :live_attempts_count, :integer, default: 0, null: false
    up_only do
      execute <<~SQL.squish
        UPDATE live_results lr
        SET live_attempts_count = (
          SELECT COUNT(*) FROM live_attempts la WHERE la.live_result_id = lr.id
        )
      SQL
    end
  end
end
