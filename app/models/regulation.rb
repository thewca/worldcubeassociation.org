# frozen_string_literal: true

class Regulation < SimpleDelegator
  REGULATIONS_JSON_PATH = "wca-regulations.json"

  def self.regulations
    Rails.cache.read('regulations') || []
  end

  def self.regulations_by_id
    self.regulations.index_by { |r| r["id"] }
  end

  def self.regulations_load_error
    Rails.cache.read('regulations_load_error')
  end

  def self.reload_regulations(s3)
    reset_regulations

    regulations_json = JSON.parse(s3.bucket(RegulationTranslationsHelper::BUCKET_NAME).object(REGULATIONS_JSON_PATH).get.body.read).freeze
    Rails.cache.write('regulations', regulations_json)
  rescue StandardError => e
    Rails.cache.write('regulations_load_error', e)
  end

  def self.reset_regulations
    Rails.cache.delete('regulations')
    Rails.cache.delete('regulations_load_error')
  end

  if Rails.env.production?
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
