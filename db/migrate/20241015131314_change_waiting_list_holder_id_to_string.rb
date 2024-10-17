# frozen_string_literal: true

class ChangeWaitingListHolderIdToString < ActiveRecord::Migration[7.2]
  def change
    change_column :waiting_lists, :holder_id, :string
  end
end
