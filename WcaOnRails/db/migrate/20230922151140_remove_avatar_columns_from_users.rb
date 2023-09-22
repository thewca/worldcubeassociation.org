class RemoveAvatarColumnsFromUsers < ActiveRecord::Migration[7.0]
  def change
    remove_column :users, :avatar
    remove_column :users, :pending_avatar
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
