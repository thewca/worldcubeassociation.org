# frozen_string_literal: true

class RenameCropCoordinatesInUsers < ActiveRecord::Migration
  def change
    # Rename the columns from the carrierwave-crop defaults, because we
    # don't want to recrop every single time we save a user.
    rename_column :users, :avatar_crop_x, :saved_avatar_crop_x
    rename_column :users, :avatar_crop_y, :saved_avatar_crop_y
    rename_column :users, :avatar_crop_w, :saved_avatar_crop_w
    rename_column :users, :avatar_crop_h, :saved_avatar_crop_h

    rename_column :users, :pending_avatar_crop_x, :saved_pending_avatar_crop_x
    rename_column :users, :pending_avatar_crop_y, :saved_pending_avatar_crop_y
    rename_column :users, :pending_avatar_crop_w, :saved_pending_avatar_crop_w
    rename_column :users, :pending_avatar_crop_h, :saved_pending_avatar_crop_h
  end
end
