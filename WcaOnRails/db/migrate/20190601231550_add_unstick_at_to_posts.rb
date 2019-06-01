# frozen_string_literal: true

class AddUnstickAtToPosts < ActiveRecord::Migration[5.2]
  def change
    add_column :posts, :unstick_at, :date, null: true, default: nil
  end
end
