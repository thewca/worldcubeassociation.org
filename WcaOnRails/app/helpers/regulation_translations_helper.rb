# frozen_string_literal: true

module RegulationTranslationsHelper
  TRANSLATIONS_FOLDER_PATH = "translations".freeze

  TRANSLATIONS_HASH_FILE = "#{TRANSLATIONS_FOLDER_PATH}/version".freeze
  TRANSLATIONS_DATE_FILE = "#{TRANSLATIONS_FOLDER_PATH}/version-date".freeze
  BUCKET_NAME = 'wca-regulations'

  @@s3 = Aws::S3::Resource.new(
    region: EnvConfig.STORAGE_AWS_REGION,
    credentials: Aws::InstanceProfileCredentials.new
  ).bucket(BUCKET_NAME)

  private def translations_metadata
    @@metadata_cache ||= []
    build_hash = current_build_hash

    if @@metadata_cache.empty? || build_hash != @@cached_for_hash


      metadata_objects = @@s3.objects(prefix: TRANSLATIONS_FOLDER_PATH)
      puts metadata_objects.to_a
      metadata_index = metadata_objects.filter { |object| File.extname(object.key) == ".json" }
                                       .index_by { |object| File.basename(File.dirname(object.key)) }
                                       .transform_values { |object| object.get.body.read.strip }
                                       .transform_values { |raw| JSON.parse(raw, symbolize_names: true) }
                                       .map { |k, hash| with_relative_url(hash, k) }

      @@metadata_cache = metadata_index
      @@cached_for_hash = build_hash
    end

    @@metadata_cache
  end

  private def with_relative_url(hash, tag)
    hash[:url] = "./#{tag}"
    hash
  end

  private def current_build_hash
    @@s3.object(TRANSLATIONS_HASH_FILE).get.body.read.strip
  end

  private def current_base_version
    @@s3.object(TRANSLATIONS_DATE_FILE).get.body.read.strip
  end

  def current_reg_translations
    # avoid File.read-ing this during every `select` iteration
    base_version = current_base_version

    translations_metadata.select { |metadata| metadata[:version] == base_version }
                         .sort_by { |metadata| metadata[:language_english] }
  end

  def outdated_reg_translations
    # avoid File.read-ing this during every `select` iteration
    base_version = current_base_version

    translations_metadata.select { |metadata| metadata[:version] != base_version }
                         .sort_by { |metadata| metadata[:language_english] }
                         .sort_by { |metadata| Date.parse(metadata[:version]) }
                         .reverse
  end
end
