# frozen_string_literal: true

class AddIdToInboxResults < ActiveRecord::Migration[5.2]
  def change
    add_column :InboxResults, :id, :primary_key
  end
end
