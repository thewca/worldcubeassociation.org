# frozen_string_literal: true

class ChangeScrambleToRoundReferenceNotNull < ActiveRecord::Migration[7.2]
  def change
    change_column_null :scrambles, :round_id, false
  end
end
