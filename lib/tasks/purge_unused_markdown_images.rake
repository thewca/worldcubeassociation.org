# frozen_string_literal: true

# Deletes uploaded files that nothing points at any more.
# 25.1 GB, about a fifth of everything in ActiveStorage.
#
# Two separate populations, reported and purged separately:
#
#   1. bare orphan blobs - what UploadController produced before it created
#      MarkdownImage records. Attached to nothing, embedded nowhere.
#   2. MarkdownImages with no usages - abandoned drafts, and images edited out
#      of the last record that referenced them.
#
# This deletes from S3 and cannot be undone.
#
#   bin/rails markdown_images:purge_unused                  # dry run
#   bin/rails markdown_images:purge_unused LIMIT=100 DRY_RUN=false
#   bin/rails markdown_images:purge_unused DRY_RUN=false
#
# BEFORE defaults to 30 days ago rather than today. An image uploaded into a
# draft that has not been saved yet is referenced by nothing, and deleting it
# would break the post the moment its author hits save.

namespace :markdown_images do
  desc "Delete uploaded files that no record attaches and no markdown embeds (DRY_RUN=true by default)"
  task purge_unused: :environment do
    dry_run = ENV.fetch('DRY_RUN', 'true') != 'false'
    before = Date.parse(ENV.fetch('BEFORE', 30.days.ago.to_date.to_s))
    limit = ENV['LIMIT']&.to_i
    cdn_host = URI.parse(EnvConfig.S3_UPLOADS_ASSET_HOST).host

    puts dry_run ? "DRY RUN - nothing will be deleted. Set DRY_RUN=false to apply." : "DELETING FROM S3 - this cannot be undone."
    puts "only files created before #{before}"
    puts

    # "Unused" means "not embedded in any column we know to scan", so a column we
    # do not know about turns a live image into a deletion. This found
    # incidents.public_summary, which no one expected to hold image URLs because
    # that editor has uploads disabled. Cheap insurance against the next one.
    known = HasMarkdownImages.models.flat_map { |model| model::MARKDOWN_IMAGE_COLUMNS.map { "#{model.table_name}.#{it}" } }

    candidates = ActiveRecord::Base.connection.select_rows(<<~SQL.squish)
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND data_type IN ('text', 'mediumtext', 'longtext')
      ORDER BY table_name, column_name
    SQL

    puts "preflight: scanning #{candidates.size} text columns for image URLs we do not know about..."

    unexpected = candidates.reject { known.include?("#{it.first}.#{it.second}") }.select do |table, column|
      quoted_column = ActiveRecord::Base.connection.quote_column_name(column)

      ActiveRecord::Base.connection.select_value(
        "SELECT 1 FROM #{ActiveRecord::Base.connection.quote_table_name(table)} " \
        "WHERE #{quoted_column} LIKE '%active_storage/blobs%'    " \
        "OR #{quoted_column} LIKE #{ActiveRecord::Base.connection.quote("%#{cdn_host}%")} LIMIT 1",
      )
    end

    if unexpected.any?
      abort <<~MESSAGE
        Refusing to run. These columns embed ActiveStorage URLs but are not declared in any
        MARKDOWN_IMAGE_COLUMNS, so their images would be treated as unused and deleted:

        #{unexpected.map { "  #{it.first}.#{it.second}" }.join("\n")}

        Add the model to HasMarkdownImages (or add the column to its MARKDOWN_IMAGE_COLUMNS)
        and run again.
      MESSAGE
    end

    puts "preflight: clean"
    puts

    # Recomputed live, every run. Never trust a list of ids from an earlier scan:
    # markdown edited in between would make a file that is now in use look unused.
    #
    # Both URL shapes have to be matched, on any host. The backfill only looks for
    # the historical worldcubeassociation.org/rails/active_storage/blobs form
    # because that is all the old content has, but anything uploaded since is
    # embedded as a CDN URL - missing those would delete live images.
    referenced = Set.new
    referenced_images = Set.new

    HasMarkdownImages.models.each do |model|
      model::MARKDOWN_IMAGE_COLUMNS.each do |column|
        arel_column = model.arel_table[column]
        embeds_an_image = arel_column.matches('%active_storage/blobs%').or(arel_column.matches("%#{cdn_host}%"))

        model.where(embeds_an_image).find_each do |record|
          markdown = record.public_send(column)
          referenced.merge(MarkdownImage.blob_ids_in(markdown))
          referenced_images.merge(MarkdownImage.image_ids_in(markdown))
        end
      end
    end

    puts "#{referenced.size} blobs are embedded in markdown right now"

    markdown_image_blob_ids = ActiveStorage::Attachment.where(record_type: MarkdownImage.polymorphic_name).select(:blob_id)

    # Anything attached to something other than a MarkdownImage is off limits:
    # delegate report setup images, avatars, regional organisation documents.
    orphans = ActiveStorage::Blob.where.missing(:attachments)
                                 .where.not(id: referenced.to_a)
                                 .where(created_at: ...before)

    unused_images = MarkdownImage.unused.where(created_at: ...before)
                                 .where.not(id: MarkdownImage.with_blob_ids(referenced.to_a))
                                 .where.not(id: referenced_images.to_a)

    summarise = lambda { |label, count, bytes|
      puts format("  %<label>-34s %<count>7d  %<size>10s", label: label, count: count, size: ActiveSupport::NumberHelper.number_to_human_size(bytes))
    }

    summarise.call("orphan blobs (pre-MarkdownImage)", orphans.count, orphans.sum(:byte_size))
    summarise.call("MarkdownImages with no usages", unused_images.count, ActiveStorage::Blob.where(id: markdown_image_blob_ids.where(record_id: unused_images.select(:id))).sum(:byte_size))
    puts

    next if dry_run

    deleted = 0
    freed = 0

    orphans.find_each do |blob|
      freed += blob.byte_size
      blob.purge
      deleted += 1
      puts "  purged #{deleted} orphan blobs..." if (deleted % 500).zero?
      break if limit && deleted >= limit
    end

    unused_images.find_each do |markdown_image|
      freed += markdown_image.image.byte_size if markdown_image.image.attached?
      markdown_image.destroy!
      deleted += 1
      break if limit && deleted >= limit
    end

    puts
    puts "deleted #{deleted} files, freed #{ActiveSupport::NumberHelper.number_to_human_size(freed)}"
  end
end
