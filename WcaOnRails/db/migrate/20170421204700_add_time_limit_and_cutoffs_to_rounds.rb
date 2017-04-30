# frozen_string_literal: true

class AddTimeLimitAndCutoffsToRounds < ActiveRecord::Migration[5.0]
  def change
    add_column :rounds, :time_limit, :text
    add_column :rounds, :cutoff, :text
    add_column :rounds, :advance_to_next_round_requirement, :text
  end
end
