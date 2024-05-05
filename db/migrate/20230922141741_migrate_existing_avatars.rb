# frozen_string_literal: true

class MigrateExistingAvatars < ActiveRecord::Migration[7.0]
  def change
    rename_column :users, :avatar, :legacy_avatar
    rename_column :users, :pending_avatar, :legacy_pending_avatar

    add_column :users, :current_avatar_id, :bigint, after: :legacy_avatar
    add_column :users, :pending_avatar_id, :bigint, after: :current_avatar_id

    User.where.not(legacy_avatar: nil).find_each do |user|
      avatar = UserAvatar.create!({
                                    user_id: user.id,
                                    filename: user.legacy_avatar,
                                    status: UserAvatar.statuses[:approved],
                                    thumbnail_crop_x: user.saved_avatar_crop_x,
                                    thumbnail_crop_y: user.saved_avatar_crop_y,
                                    thumbnail_crop_w: user.saved_avatar_crop_w,
                                    thumbnail_crop_h: user.saved_avatar_crop_h,
                                    backend: UserAvatar.backends[:s3_legacy_cdn],
                                  })

      user.update_attribute :current_avatar, avatar
    end

    User.where.not(legacy_pending_avatar: nil).find_each do |user|
      avatar = UserAvatar.create!({
                                    user_id: user.id,
                                    filename: user.legacy_pending_avatar,
                                    status: UserAvatar.statuses[:pending],
                                    thumbnail_crop_x: user.saved_pending_avatar_crop_x,
                                    thumbnail_crop_y: user.saved_pending_avatar_crop_y,
                                    thumbnail_crop_w: user.saved_pending_avatar_crop_w,
                                    thumbnail_crop_h: user.saved_pending_avatar_crop_h,
                                    backend: UserAvatar.backends[:s3_legacy_cdn],
                                  })

      user.update_attribute :pending_avatar, avatar
    end
  end
end
