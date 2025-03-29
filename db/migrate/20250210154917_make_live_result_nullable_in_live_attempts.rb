# rubocop:disable all
# frozen_string_literal: true

class MakeLiveResultNullableInLiveAttempts < ActiveRecord::Migration[7.2]
  def change
    change_column_null :live_attempts, :live_result_id, true
  end
end
