# frozen_string_literal: true

class ChangeRcheValueToText < ActiveRecord::Migration[7.2]
  def change
    change_column :registration_history_changes, :value, :text
  end
end
