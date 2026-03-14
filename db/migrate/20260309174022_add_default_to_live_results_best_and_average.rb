# frozen_string_literal: true

class AddDefaultToLiveResultsBestAndAverage < ActiveRecord::Migration[8.1]
  def change
    change_column_default :live_results, :best, from: nil, to: 0
    change_column_default :live_results, :average, from: nil, to: 0
  end
end
