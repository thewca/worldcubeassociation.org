# frozen_string_literal: true

class RemoveTimestampsTable < ActiveRecord::Migration[7.0]
  def change
    drop_table :timestamps
  end
end
