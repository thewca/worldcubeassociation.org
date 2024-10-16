# frozen_string_literal: true

class MigrateExistingAvatars < ActiveRecord::Migration[7.0]
  def change
    rename_column :users, :avatar, :legacy_avatar
    rename_column :users, :pending_avatar, :legacy_pending_avatar

    add_column :users, :current_avatar_id, :bigint, after: :legacy_avatar
    add_column :users, :pending_avatar_id, :bigint, after: :current_avatar_id

    reversible do |direction|
      direction.up do
        execute <<-SQL
            INSERT INTO user_avatars
            (user_id, filename, status, thumbnail_crop_x, thumbnail_crop_y, thumbnail_crop_w, thumbnail_crop_h, backend, created_at, updated_at)
            SELECT id, legacy_avatar, 'approved', saved_avatar_crop_x, saved_avatar_crop_y, saved_avatar_crop_w, saved_avatar_crop_h, 's3-legacy-cdn', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM users
            WHERE legacy_avatar IS NOT NULL
        SQL

        execute <<-SQL
            UPDATE users
            INNER JOIN user_avatars
                ON users.id = user_avatars.user_id
                    AND user_avatars.status = 'approved'
            SET users.current_avatar_id = user_avatars.id
        SQL

        execute <<-SQL
            INSERT INTO user_avatars
            (user_id, filename, status, thumbnail_crop_x, thumbnail_crop_y, thumbnail_crop_w, thumbnail_crop_h, backend, created_at, updated_at)
            SELECT id, legacy_pending_avatar, 'pending', saved_pending_avatar_crop_x, saved_pending_avatar_crop_y, saved_pending_avatar_crop_w, saved_pending_avatar_crop_h, 's3-legacy-cdn', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM users
            WHERE legacy_pending_avatar IS NOT NULL
        SQL

        execute <<-SQL
            UPDATE users
            INNER JOIN user_avatars
                ON users.id = user_avatars.user_id
                    AND user_avatars.status = 'pending'
            SET users.pending_avatar_id = user_avatars.id
        SQL
      end

      direction.down do
        UserAvatar.delete_all
      end
    end
  end
end
