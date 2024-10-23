# frozen_string_literal: true

MASTER_PREFIX = 'uploads/user/avatar/'
PREFIX_REGEX = %r{/([1-9][[:digit:]]{3}[[:upper:]]{4}[[:digit:]]{2})/.*/([[:alnum:]]+\.[[:alnum:]]+)}

def s3_active_storage
  ActiveStorage::Blob.services.fetch(EnvConfig.AVATARS_PUBLIC_STORAGE)
end

def public_s3_bucket
  # Break into the ActiveStorage S3 implementation which holds an internal, fully initialized SDK resource
  s3_active_storage.send(:bucket)
end

def list_avatar_files
  public_s3_bucket.objects({ prefix: MASTER_PREFIX })
end

namespace :user_avatars do
  desc "Migrate old, deleted S3 avatars"
  task migrate_deleted: :environment do
    user_cache = {}

    list_avatar_files.each do |f|
      next if f.key == MASTER_PREFIX

      PREFIX_REGEX.match(f.key) do |match|
        wca_id = match[1]
        filename = match[2]

        user = user_cache[wca_id] || User.find_by(wca_id: wca_id)
        user_cache[wca_id] = user

        avatar_filename = user.current_avatar&.filename
        pending_avatar_filename = user.pending_avatar&.filename

        break if filename == avatar_filename || filename == pending_avatar_filename

        is_rejected = f.key.include?('/rejected/')
        is_thumbnail = f.key.include?('_thumb')

        unless is_thumbnail
          historic_avatar = user.user_avatars.create!(
            filename: filename,
            status: is_rejected ? UserAvatar.statuses[:rejected] : UserAvatar.statuses[:deprecated],
          )

          downloaded_image = StringIO.new(s3_active_storage.download(f.key))

          historic_avatar.attach_image(
            io: downloaded_image,
            filename: filename,
          )
        end

        s3_active_storage.delete(f.key)
      end
    end
  end

  desc "Migrate current avatars"
  task migrate_current: :environment do
    user_cache = {}

    list_avatar_files.each do |f|
      next if f.key == MASTER_PREFIX

      PREFIX_REGEX.match(f.key) do |match|
        wca_id = match[1]
        filename = match[2]

        user = user_cache[wca_id] || User.find_by(wca_id: wca_id)
        user_cache[wca_id] = user

        avatar_filename = user.current_avatar&.filename
        pending_avatar_filename = user.pending_avatar&.filename

        if filename == avatar_filename
          matching_avatar = user.current_avatar
        elsif filename == pending_avatar_filename
          matching_avatar = user.pending_avatar
        end

        break unless matching_avatar.present?

        downloaded_image = StringIO.new(s3_active_storage.download(f.key))

        matching_avatar.attach_image(
          io: downloaded_image,
          filename: filename,
        )

        s3_active_storage.delete(f.key)

        matching_avatar.update!(backend: 'active-storage')
      end
    end
  end
end
