# frozen_string_literal: true

require 'aws-sdk-s3'
module DocumentsHelper
  ARCHIVE_DATE_FILE = "version"
  BUCKET_NAME = 'wca-documents'
  DOCUMENTS_HOST = 'https://documents.worldcubeassociation.org'
  MOTIONS_PREFIX = 'documents/motions/'
  # Motions are named "<section>.<year>.<subsection> - <Title>.pdf", where the
  # year is the version: amending a motion republishes it under a later year,
  # sometimes under a different title, but always with the same section and
  # subsection.
  MOTION_FILENAME = /\A(?<section>\d+)\.(?<year>\d{4})\.(?<subsection>\d+) - /

  private def archive_metadata
    bucket = Aws::S3::Resource.new(
      credentials: Aws::ECSCredentials.new,
    ).bucket(BUCKET_NAME)

    prefix = "documents/"
    version = bucket.object(ARCHIVE_DATE_FILE).get.body.read.strip

    Rails.cache.fetch("document-list-#{version}", expires_in: 7.days) do
      bucket.objects(prefix: prefix).map do |object|
        { name: File.basename(object.key, ".pdf"), key: object.key }
      end
    end
  end

  def documents_list(directory)
    documents = archive_metadata.filter { |document| document[:key].include? directory }
                                .map { |document| content_tag(:li, link_to(document[:name], "#{DOCUMENTS_HOST}/#{document[:key]}")) }
    safe_join documents
  end

  # Section and subsection are compared numerically because sections are zero-padded
  # in filenames ("01.2025.1 - Spirit.pdf") but are cited without the padding.
  def latest_motion_url(section, subsection)
    versions = archive_metadata.filter_map do |document|
      next unless document[:key].start_with?(MOTIONS_PREFIX)

      match = MOTION_FILENAME.match(document[:name])
      next unless match && match[:section].to_i == section.to_i && match[:subsection].to_i == subsection.to_i

      [match[:year].to_i, document[:key]]
    end

    latest_key = versions.max_by(&:first)&.last
    "#{DOCUMENTS_HOST}/#{URI::DEFAULT_PARSER.escape(latest_key)}" if latest_key
  end
end
