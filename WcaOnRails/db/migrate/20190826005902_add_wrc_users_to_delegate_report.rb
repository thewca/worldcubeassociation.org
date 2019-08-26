# frozen_string_literal: true

class AddWrcUsersToDelegateReport < ActiveRecord::Migration[5.2]
  def change
    add_column :delegate_reports, :wrc_primary_user_id, :int, null: true
    add_column :delegate_reports, :wrc_secondary_user_id, :int, null: true
  end
end
