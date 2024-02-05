# frozen_string_literal: true

require 'aws-sdk-s3'
module DocumentsHelper
  ARCHIVE_DATE_FILE = "version"
  BUCKET_NAME = 'wca-documents'

  private def archive_metadata
    bucket = Aws::S3::Resource.new(
      region: EnvConfig.STORAGE_AWS_REGION,
      credentials: Aws::InstanceProfileCredentials.new,
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
                                .map { |document| content_tag(:li, link_to(document[:name], "https://documents.worldcubeassociation.org/#{document[:key]}")) }
    safe_join documents
  end
end
