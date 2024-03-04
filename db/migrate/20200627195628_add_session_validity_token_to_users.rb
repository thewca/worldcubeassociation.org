# frozen_string_literal: true

class AddSessionValidityTokenToUsers < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :session_validity_token, :string
  end
end
