# frozen_string_literal: true

class MigrateExistingAvatars < ActiveRecord::Migration[7.0]
  def change
    User.where.not(avatar: nil).find_each do |user|
      UserAvatar.create!(
        user_id: user.id,
        filename: user.avatar.identifier,
        status: UserAvatar.statuses[:approved],
        thumbnail_crop_x: user.saved_avatar_crop_x,
        thumbnail_crop_y: user.saved_avatar_crop_y,
        thumbnail_crop_w: user.saved_avatar_crop_w,
        thumbnail_crop_h: user.saved_avatar_crop_h,
        backend: UserAvatar.backends[:s3_cdn],
      )
    end

    User.where.not(pending_avatar: nil).find_each do |user|
      UserAvatar.create!(
        user_id: user.id,
        filename: user.avatar.identifier,
        status: UserAvatar.statuses[:pending],
        thumbnail_crop_x: user.saved_pending_avatar_crop_x,
        thumbnail_crop_y: user.saved_pending_avatar_crop_y,
        thumbnail_crop_w: user.saved_pending_avatar_crop_w,
        thumbnail_crop_h: user.saved_pending_avatar_crop_h,
        backend: UserAvatar.backends[:s3_cdn],
        )
    end
  end
end
