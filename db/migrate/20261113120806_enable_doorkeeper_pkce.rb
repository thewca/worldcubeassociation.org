# frozen_string_literal: true

class EnableDoorkeeperPkce < ActiveRecord::Migration[8.1]
  def change
    change_table :oauth_access_grants, bulk: true do |t|
      t.string :code_challenge, null: true
      t.string :code_challenge_method, null: true
    end
  end
end
