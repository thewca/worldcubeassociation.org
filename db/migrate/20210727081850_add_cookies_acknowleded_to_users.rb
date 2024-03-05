# frozen_string_literal: true

class AddCookiesAcknowlededToUsers < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :cookies_acknowledged, :boolean, null: false, default: false
  end
end
