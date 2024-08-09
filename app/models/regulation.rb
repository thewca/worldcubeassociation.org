# frozen_string_literal: true

class Regulation < SimpleDelegator
  REGULATIONS_JSON_PATH = "wca-regulations.json"

  mattr_accessor :regulations, instance_accessor: false, default: []
  mattr_accessor :regulations_load_error, instance_accessor: false

  def self.regulations_by_id
    self.regulations.index_by { |r| r["id"] }
  end

  def self.reload_regulations(s3)
    reset_regulations

    self.regulations = JSON.parse(s3.bucket(RegulationTranslationsHelper::BUCKET_NAME).object(REGULATIONS_JSON_PATH).get.body.read).freeze
  rescue StandardError => e
    self.regulations_load_error = e
  end

  def self.reset_regulations
    self.regulations = []
    self.regulations_load_error = nil
  end

  if Rails.env.production? && !EnvConfig.ASSETS_COMPILATION?
    reload_regulations(Aws::S3::Resource.new(
                         region: EnvConfig.STORAGE_AWS_REGION,
                         credentials: Aws::ECSCredentials.new,
                       ))
  end

  def limit(number)
    first(number)
  end

  def self.find_or_nil(id)
    self.regulations_by_id[id]
  end

  def self.search(query, *)
    matched_regulations = self.regulations.dup
    query.downcase.split.each do |part|
      matched_regulations.select! do |reg|
        %w(content_html id).any? { |field| reg[field].downcase.include?(part) }
      end
    end
    Regulation.new(matched_regulations)
  end
end
