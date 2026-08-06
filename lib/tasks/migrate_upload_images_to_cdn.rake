# frozen_string_literal: true

# Moves UploadController images off the default ActiveStorage bucket (which has
# no CDN in front of it, and was costing ~$100/mo in S3 egress) and onto
# uploads.worldcubeassociation.org.
#
# Two phases, both idempotent and safe to re-run:
#   1. server-side S3 copy of each referenced blob into the uploads bucket
#   2. rewrite the embedded markdown URLs to point at the CDN
#
# The copy is a copy, not a move, so existing URLs keep working throughout.
#
#   bin/rails uploads:migrate_to_cdn              # dry run, writes nothing
#   bin/rails uploads:migrate_to_cdn DRY_RUN=false
#   bin/rails uploads:migrate_to_cdn LIMIT=20     # try a handful first

module UploadImageMigration
  # Public, visitor-facing markdown only.
  #
  # DelegateReport columns are deliberately absent: those images sit behind
  # authenticate_user! and must not be copied into a public bucket. They also
  # generate almost no traffic, so there is nothing to gain by including them.
  MIGRATED_COLUMNS = {
    'CompetitionTab' => %i[content],
    'Post' => %i[body],
    'Competition' => %i[information extra_registration_requirements],
  }.freeze

  # Matches both the current /blobs/redirect/<sid>/<file> form and the older
  # /blobs/<sid>/<file> one, with or without the www.
  #
  # The '=' in the character class matters: a chunk of the older content encodes
  # pretty-printed JSON, whose base64 carries padding inside the signed id.
  # Without it the match truncates and ~17% of URLs are silently missed.
  URL_PATTERN = %r{
    https?://(?:www\.)?worldcubeassociation\.org
    /rails/active_storage/blobs(?:/redirect)?/
    (?<signed_id>[A-Za-z0-9_=-]+--[A-Za-z0-9_=-]+)
    (?:/[^)\s"'<>]*)?
  }x

  module_function

  def dry_run?
    ENV.fetch('DRY_RUN', 'true') != 'false'
  end

  def cdn_host
    EnvConfig.S3_UPLOADS_ASSET_HOST.presence or
      raise "S3_UPLOADS_ASSET_HOST is not set"
  end

  def uploads_service
    ActiveStorage::Blob.services.fetch(EnvConfig.UPLOADS_STORAGE)
  end

  # Break into the ActiveStorage S3 implementation for its initialised SDK
  # resource, the same way lib/tasks/user_avatars.rake does.
  def uploads_bucket
    uploads_service.send(:bucket)
  end

  def source_bucket_name
    EnvConfig.STORAGE_AWS_BUCKET.presence or
      raise "STORAGE_AWS_BUCKET is not set - refusing to copy from an empty bucket name"
  end

  # The blob id is stored in plaintext inside the signed id; the signature only
  # prevents forgery. We decode rather than verify because the legacy and modern
  # signatures use different keys, and because a forged id cannot do damage here
  # anyway - eligible_blob below refuses anything that is attached to a record.
  def blob_id_from(signed_id)
    # Strip any existing padding before re-padding, so both the padded and
    # unpadded encodings in the wild decode the same way.
    payload = signed_id.split('--').first.delete('=')
    padded = payload + ('=' * (-payload.length % 4))
    rails = JSON.parse(Base64.urlsafe_decode64(padded)).fetch('_rails')

    return rails['data'] if rails.key?('data')

    marshal_integer(Base64.decode64(rails.fetch('message')))
  rescue StandardError
    nil
  end

  # Legacy signed ids wrap a Marshal-encoded integer. Parse it by hand rather
  # than calling Marshal.load on stored content.
  def marshal_integer(raw)
    return nil unless raw.byteslice(0, 3) == "\x04\bi".b

    bytes = raw.byteslice(3..).to_s.bytes
    head = bytes.shift
    return nil if head.nil?
    return 0 if head.zero?
    return head - 5 if head.between?(5, 127)
    return nil unless head.between?(1, 4)

    bytes.first(head).each_with_index.sum { |byte, i| byte << (8 * i) }
  end

  # Only unattached blobs are eligible. UploadController creates blobs with no
  # record, whereas delegate report images and regional organisation files go
  # through has_*_attached and therefore have an attachment row. This is what
  # keeps private content out of the public bucket.
  def eligible_blob(blob_id)
    blob = ActiveStorage::Blob.find_by(id: blob_id)

    return [nil, :not_found] if blob.nil?
    return [nil, :attached] if ActiveStorage::Attachment.exists?(blob_id: blob.id)

    [blob, nil]
  end

  def copy_blob(blob)
    return :already_migrated if blob.service_name == EnvConfig.UPLOADS_STORAGE

    unless dry_run?
      uploads_bucket.object(blob.key)
                    .copy_from("#{source_bucket_name}/#{blob.key}")

      # Only after the object exists, so an interrupted run never leaves a blob
      # pointing at a bucket it has not been copied into yet.
      blob.update_column(:service_name, EnvConfig.UPLOADS_STORAGE)
    end

    :copied
  end

  def cdn_url_for(blob)
    URI.join(cdn_host, blob.key).to_s
  end
end

namespace :uploads do
  desc "Migrate UploadController images to the uploads CDN bucket (DRY_RUN=true by default)"
  task migrate_to_cdn: :environment do
    include UploadImageMigration

    limit = ENV['LIMIT']&.to_i
    stats = Hash.new(0)
    seen_blobs = {}

    puts UploadImageMigration.dry_run? ? "DRY RUN - nothing will be written. Set DRY_RUN=false to apply." : "APPLYING CHANGES"
    puts "source bucket: #{EnvConfig.STORAGE_AWS_BUCKET.presence || '(unset - dry run only)'}"
    puts "target:        #{UploadImageMigration.cdn_host}"
    puts

    UploadImageMigration::MIGRATED_COLUMNS.each do |model_name, columns|
      model = model_name.constantize

      columns.each do |column|
        scope = model.where(model.arel_table[column].matches('%active_storage/blobs%'))
        puts "#{model_name}##{column}: #{scope.count} rows"

        scope.find_each do |row|
          content = row.public_send(column)
          next if content.blank?

          rewritten = content.gsub(UploadImageMigration::URL_PATTERN) do |original_url|
            signed_id = Regexp.last_match[:signed_id]
            blob_id = UploadImageMigration.blob_id_from(signed_id)

            if blob_id.nil?
              stats[:undecodable] += 1
              next original_url
            end

            blob, reason = seen_blobs[blob_id] ||= UploadImageMigration.eligible_blob(blob_id)

            if blob.nil?
              stats[reason] += 1
              next original_url
            end

            stats[UploadImageMigration.copy_blob(blob)] += 1
            stats[:urls_rewritten] += 1

            UploadImageMigration.cdn_url_for(blob)
          end

          next if rewritten == content

          stats[:rows_changed] += 1
          row.update_attribute(column, rewritten) unless UploadImageMigration.dry_run?

          if limit && stats[:rows_changed] >= limit
            puts "LIMIT=#{limit} reached, stopping."
            break
          end
        end
      end
    end

    puts
    puts "rows changed:     #{stats[:rows_changed]}"
    puts "urls rewritten:   #{stats[:urls_rewritten]}"
    puts "blobs copied:     #{stats[:copied]}"
    puts "already migrated: #{stats[:already_migrated]}"
    puts "skipped (attached/private):  #{stats[:attached]}"
    puts "skipped (blob not found):    #{stats[:not_found]}"
    puts "skipped (undecodable id):    #{stats[:undecodable]}"
  end
end
