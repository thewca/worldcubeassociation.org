# frozen_string_literal: true

class RemoveJwtDenylist < ActiveRecord::Migration[7.2]
  def change
    drop_table :jwt_denylist do |t|
      t.string :jti, null: false
      t.datetime :exp, null: false
    end
  end
end
