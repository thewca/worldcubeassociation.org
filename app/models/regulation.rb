# frozen_string_literal: true

class Regulation < SimpleDelegator
  REGULATIONS_JSON_PATH = "wca-regulations.json"

  def self.reload_regulations(s3)
    @regulations = JSON.parse(s3.bucket(RegulationTranslationsHelper::BUCKET_NAME).object(REGULATIONS_JSON_PATH).get.body.read).freeze
    @regulations_by_id = @regulations.index_by { |r| r["id"] }
    @regulations_load_error = nil
  rescue StandardError => e
    reset_regulations
    @regulations_load_error = e
  end

  def self.reset_regulations
    @regulations = []
    @regulations_by_id = {}
    @regulations_load_error = nil
  end

  if Rails.env.production?
    reload_regulations(Aws::S3::Resource.new(
                         region: EnvConfig.STORAGE_AWS_REGION,
                         credentials: Aws::ECSCredentials.new,
                       ))
  else
    reset_regulations
  end

  class << self
    attr_accessor :regulations_load_error
  end

  def limit(number)
    first(number)
  end

  def self.find_or_nil(id)
    @regulations_by_id[id]
  end

  def self.search(query, *)
    matched_regulations = @regulations.dup
    query.downcase.split.each do |part|
      matched_regulations.select! do |reg|
        %w(content_html id).any? { |field| reg[field].downcase.include?(part) }
      end
    end
    Regulation.new(matched_regulations)
  end
end
