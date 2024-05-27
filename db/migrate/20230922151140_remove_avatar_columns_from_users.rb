# frozen_string_literal: true

class RemoveAvatarColumnsFromUsers < ActiveRecord::Migration[7.0]
  def change
    # These two columns had been renamed in the previous migration to avoid naming collisions.
    remove_column :users, :legacy_avatar
    remove_column :users, :legacy_pending_avatar

    remove_column :users, :saved_avatar_crop_x
    remove_column :users, :saved_avatar_crop_y
    remove_column :users, :saved_avatar_crop_w
    remove_column :users, :saved_avatar_crop_h
    remove_column :users, :saved_pending_avatar_crop_x
    remove_column :users, :saved_pending_avatar_crop_y
    remove_column :users, :saved_pending_avatar_crop_w
    remove_column :users, :saved_pending_avatar_crop_h
  end
end
