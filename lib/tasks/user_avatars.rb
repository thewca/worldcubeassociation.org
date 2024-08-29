# frozen_string_literal: true

namespace :user_avatars do
  desc "Migrate old, deleted S3 avatars"
  task :migrate_deleted => :environment do
    service = ActiveStorage::Blob.services.fetch(EnvConfig.AVATARS_PUBLIC_STORAGE)

    s3_bucket = service.send(:bucket)

    master_prefix = 'uploads/user/avatar/'
    prefix_regex = /\/([1-9][[:digit:]]{3}[[:upper:]]{4}[[:digit:]]{2})\/.*\/([[:alnum:]]+\.[[:alnum:]]+)/

    files = s3_bucket.objects({ prefix: master_prefix, delimiter: '/' })

    user_cache = {}

    files.each do |f|
      return if f.key == master_prefix

      prefix_regex.match(f.key) do |match|
        wca_id = match[1]
        filename = match[2]

        user = user_cache[wca_id] || User.find_by(wca_id: wca_id)
        user_cache[wca_id] = user

        avatar_filename = user.current_avatar&.filename
        pending_avatar_filename = user.pending_avatar&.filename

        return if filename == avatar_filename || filename == pending_avatar_filename

        is_rejected = f.key.include?('/rejected/')
        is_thumbnail = f.key.include?('_thumb')

        unless is_thumbnail
          historic_avatar = user.user_avatars.create!(
            filename: filename,
            status: is_rejected ? UserAvatar.statuses[:rejected] : UserAvatar.statuses[:deprecated],
          )

          historic_avatar.attach_image(
            io: service.download(f.key),
            filename: filename,
          )
        end

        service.delete(f.key)
      end
    end
  end

  desc "Migrate current avatars"
  task :migrate_current => :environment do
    service = ActiveStorage::Blob.services.fetch(EnvConfig.AVATARS_PUBLIC_STORAGE)

    s3_bucket = service.send(:bucket)

    master_prefix = 'uploads/user/avatar/'
    prefix_regex = /\/([1-9][[:digit:]]{3}[[:upper:]]{4}[[:digit:]]{2})\/.*\/([[:alnum:]]+\.[[:alnum:]]+)/

    files = s3_bucket.objects({ prefix: master_prefix, delimiter: '/' })

    user_cache = {}

    files.each do |f|
      return if f.key == master_prefix

      prefix_regex.match(f.key) do |match|
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

        return unless matching_avatar.present?

        matching_avatar.attach_image(
          io: service.download(f.key),
          filename: filename,
        )

        service.delete(f.key)

        matching_avatar.update!(backend: 'active-storage')
      end
    end
  end
end
