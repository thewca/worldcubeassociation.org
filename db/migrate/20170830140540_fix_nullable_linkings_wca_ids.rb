# frozen_string_literal: true

class FixNullableLinkingsWcaIds < ActiveRecord::Migration[5.1]
  def change
    change_column_null :linkings, :wca_ids, false
  end
end
