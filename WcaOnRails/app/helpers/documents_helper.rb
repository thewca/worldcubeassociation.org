# frozen_string_literal: true

require 'aws-sdk-s3'
module DocumentsHelper
  def documents_list(directory)
    s3 = Aws::S3::Resource.new(
      region: EnvConfig.STORAGE_AWS_REGION,
      credentials: Aws::InstanceProfileCredentials.new,
    )

    bucket_name = 'wca-documents'
    prefix = "documents/#{directory}/"

    s3.bucket(bucket_name).objects(prefix: prefix).map do |object|
      name = File.basename(object.key, ".pdf")
      content_tag(:li, link_to(name, "https://documents.worldcubeassociation.org/#{object.key}"))
    end
  end
end
