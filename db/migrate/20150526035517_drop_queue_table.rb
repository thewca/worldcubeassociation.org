# frozen_string_literal: true

class DropQueueTable < ActiveRecord::Migration
  def change
    drop_table :queue
  end
end
