# frozen_string_literal: true

class MigrateExistingAvatars < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :current_avatar_id, :bigint, after: :avatar

    User.where.not(avatar: nil).find_each do |user|
      avatar = UserAvatar.create!(
        user_id: user.id,
        filename: user.avatar.identifier,
        status: UserAvatar.statuses[:approved],
        thumbnail_crop_x: user.saved_avatar_crop_x,
        thumbnail_crop_y: user.saved_avatar_crop_y,
        thumbnail_crop_w: user.saved_avatar_crop_w,
        thumbnail_crop_h: user.saved_avatar_crop_h,
        backend: UserAvatar.backends[:s3_cdn],
      )

      user.avatar = avatar
      user.save!
    end

    User.where.not(pending_avatar: nil).find_each do |user|
      pending_avatar = UserAvatar.create!(
        user_id: user.id,
        filename: user.avatar.identifier,
        status: UserAvatar.statuses[:pending],
        thumbnail_crop_x: user.saved_pending_avatar_crop_x,
        thumbnail_crop_y: user.saved_pending_avatar_crop_y,
        thumbnail_crop_w: user.saved_pending_avatar_crop_w,
        thumbnail_crop_h: user.saved_pending_avatar_crop_h,
        backend: UserAvatar.backends[:s3_cdn],
      )

      user.avatar = pending_avatar
      user.save!
    end
  end
end
