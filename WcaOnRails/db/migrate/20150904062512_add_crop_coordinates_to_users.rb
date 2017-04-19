# frozen_string_literal: true

class AddCropCoordinatesToUsers < ActiveRecord::Migration
  def change
    add_column :users, :avatar_crop_x, :integer
    add_column :users, :avatar_crop_y, :integer
    add_column :users, :avatar_crop_w, :integer
    add_column :users, :avatar_crop_h, :integer
    add_column :users, :pending_avatar_crop_x, :integer
    add_column :users, :pending_avatar_crop_y, :integer
    add_column :users, :pending_avatar_crop_w, :integer
    add_column :users, :pending_avatar_crop_h, :integer
  end
end
