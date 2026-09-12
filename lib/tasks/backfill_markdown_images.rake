# frozen_string_literal: true

# Associates historical UploadController images with the record whose markdown
# embeds them, so they stop being orphan blobs that nothing owns and nothing
# ever cleans up.
#
# Only the association is written. The blobs stay in whichever bucket they are
# in and the embedded URLs are left alone, so nothing breaks while this runs and
# it is safe to re-run.
#
#   bin/rails markdown_images:backfill              # dry run, writes nothing
#   bin/rails markdown_images:backfill DRY_RUN=false
#   bin/rails markdown_images:backfill LIMIT=20     # try a handful first

module MarkdownImageBackfill
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

  def models
    HasMarkdownImages.models
  end

  def blob_id_from(signed_id)
    MarkdownImage.blob_id_from(signed_id)
  end

  # Only blobs that are not already attached to something else are eligible.
  # UploadController used to create blobs with no record, whereas delegate report
  # setup images and regional organisation files go through has_*_attached and
  # already have an attachment. MarkdownImages created earlier in this run are
  # attachments too, so they are looked up first and reused.
  def eligible_blob(blob_id)
    blob = ActiveStorage::Blob.find_by(id: blob_id)

    return [nil, :not_found] if blob.nil?

    attachment = ActiveStorage::Attachment.find_by(blob_id: blob.id)

    return [blob, nil] if attachment.nil?
    return [nil, :already_attached] unless attachment.record_type == MarkdownImage.polymorphic_name

    [blob, nil]
  end

  # Validations are reported but not enforced. They exist to stop bad *new*
  # uploads; these files are already live and referenced, and refusing to own
  # them would leave exactly the orphans this migration exists to remove.
  # Attaching to an unsaved record only stages the attachment, so the report is
  # accurate on a dry run too.
  def markdown_image_for(blob, rejected)
    existing = MarkdownImage.with_blob_ids([blob.id]).first
    return existing if existing

    # Historical files keep whichever bucket they are already in - nothing is
    # moved here - but the visibility has to match the record that embeds them,
    # so that any URL regenerated later points at the right place.
    markdown_image = MarkdownImage.new(visibility: visibility_for(record))
    markdown_image.attach_image(blob)

    rejected[[blob.content_type, blob.byte_size > MarkdownImage::MAX_UPLOAD_SIZE ? :too_big : :content_type]] += 1 unless markdown_image.valid?

    return markdown_image if dry_run?

    markdown_image.save(validate: false)
    markdown_image
  end

  # Delegate report markdown is only visible to delegates and WIC; everything
  # else we scan is world-readable.
  def visibility_for(record)
    record.is_a?(DelegateReport) ? :private : :public
  end

  def record_usage(markdown_image, record)
    return :usage if dry_run?

    MarkdownImageUsage.find_or_create_by!(markdown_image: markdown_image, attachable: record)
    :usage
  end
end

namespace :markdown_images do
  desc "Report blobs that no record attaches and no markdown embeds (BEFORE=YYYY-MM-DD to ignore recent uploads)"
  task unused: :environment do
    before = Date.parse(ENV.fetch('BEFORE', Date.current.to_s))

    referenced = Set.new

    MarkdownImageBackfill.models.each do |model|
      model::MARKDOWN_IMAGE_COLUMNS.each do |column|
        model.where(model.arel_table[column].matches('%active_storage/blobs%')).find_each do |record|
          record.public_send(column).to_s.scan(MarkdownImageBackfill::URL_PATTERN) do
            blob_id = MarkdownImageBackfill.blob_id_from(Regexp.last_match[:signed_id])
            referenced << blob_id if blob_id
          end
        end
      end
    end

    attached = ActiveStorage::Attachment.distinct.pluck(:blob_id)
    unused = ActiveStorage::Blob.where.not(id: (referenced + attached).uniq).where(created_at: ...before)

    report = lambda { |label, scope, count = nil|
      puts format("  %<label>-28s %<count>7d  %<size>10s",
                  label: label, count: count || scope.count,
                  size: ActiveSupport::NumberHelper.number_to_human_size(scope.sum(:byte_size)))
    }

    puts "blobs created before #{before}"
    report.call("total", ActiveStorage::Blob)
    report.call("attached to a record", ActiveStorage::Blob.where(id: attached), attached.size)
    report.call("embedded in markdown", ActiveStorage::Blob.where(id: referenced.to_a), referenced.size)
    report.call("unused", unused)

    puts
    puts "unused by bucket:"
    unused.group(:service_name).count.sort_by { -it.last }.each do |service, count|
      report.call("  #{service}", unused.where(service_name: service), count)
    end
  end

  desc "Associate historical markdown images with the record that embeds them (DRY_RUN=true by default)"
  task backfill: :environment do
    limit = ENV['LIMIT']&.to_i
    stats = Hash.new(0)
    rejected = Hash.new(0)
    seen_blobs = {}
    images_by_blob = {}
    biggest = []

    puts MarkdownImageBackfill.dry_run? ? "DRY RUN - nothing will be written. Set DRY_RUN=false to apply." : "APPLYING CHANGES"
    puts

    MarkdownImageBackfill.models.each do |model|
      model::MARKDOWN_IMAGE_COLUMNS.each do |column|
        scope = model.where(model.arel_table[column].matches('%active_storage/blobs%'))
        puts "#{model.polymorphic_name}##{column}: #{scope.count} rows"

        scope.find_each do |record|
          record.public_send(column).to_s.scan(MarkdownImageBackfill::URL_PATTERN) do
            signed_id = Regexp.last_match[:signed_id]
            blob_id = MarkdownImageBackfill.blob_id_from(signed_id)

            if blob_id.nil?
              stats[:undecodable] += 1
              next
            end

            blob, reason = seen_blobs[blob_id] ||= MarkdownImageBackfill.eligible_blob(blob_id)

            if blob.nil?
              stats[reason] += 1
              next
            end

            unless images_by_blob.key?(blob_id)
              images_by_blob[blob_id] = MarkdownImageBackfill.markdown_image_for(blob, rejected)
              biggest << [blob.byte_size, blob.filename.to_s]
              stats[:images] += 1
            end

            stats[MarkdownImageBackfill.record_usage(images_by_blob[blob_id], record)] += 1
          end

          stats[:rows_seen] += 1
          if limit && stats[:rows_seen] >= limit
            puts "LIMIT=#{limit} reached, stopping."
            break
          end
        end
      end
    end

    puts
    stats.sort.each { |key, count| puts format("%<key>-18s %<count>d", key: key, count: count) }

    puts
    puts "largest referenced files:"
    biggest.max(5).each { |size, filename| puts format("  %<size>8s  %<filename>s", size: ActiveSupport::NumberHelper.number_to_human_size(size), filename: filename) }

    if rejected.any?
      puts
      puts "would fail the new validations (associated anyway, see claim):"
      rejected.sort_by { -it.last }.each { |(content_type, reason), count| puts format("  %<content_type>-30s %<reason>-12s %<count>d", content_type: content_type, reason: reason, count: count) }
    end
  end
end
