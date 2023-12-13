# frozen_string_literal: true

class CreateUserAvatarsTable < ActiveRecord::Migration[7.0]
  def change
    create_table :user_avatars do |t|
      t.references :user, type: :integer, index: true, foreign_key: true
      t.string :filename
      t.string :status, index: true
      t.integer :thumbnail_crop_x
      t.integer :thumbnail_crop_y
      t.integer :thumbnail_crop_w
      t.integer :thumbnail_crop_h
      t.string :backend
      t.integer :approved_by
      t.datetime :approved_at, precision: nil
      t.integer :revoked_by
      t.datetime :revoked_at, precision: nil
      t.text :revocation_reason
      t.timestamps
    end
  end
end
