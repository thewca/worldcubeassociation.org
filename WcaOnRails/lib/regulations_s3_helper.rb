# frozen_string_literal: true

module RegulationsS3Helper
  WCA_REGULATIONS_BUCKET = "wca-regulations"
  def self.fetch_regulations_from_s3(key, version_file)
    bucket = Aws::S3::Resource.new(
      region: EnvConfig.STORAGE_AWS_REGION,
      credentials: Aws::InstanceProfileCredentials.new,
    ).bucket(WCA_REGULATIONS_BUCKET)

    version = bucket.object(version_file).get.body.read.strip
    Rails.cache.fetch("regulations-file-#{version}-#{key}", expires_in: 7.days) do
      bucket.object(key).get.body.read.strip
    end
  end
end
