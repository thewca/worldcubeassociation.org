# frozen_string_literal: true

module RegulationTranslationsHelper
  TRANSLATIONS_FOLDER_PATH = "#{Rails.root}/app/views/regulations/translations".freeze

  TRANSLATIONS_HASH_FILE = "#{TRANSLATIONS_FOLDER_PATH}/version".freeze
  TRANSLATIONS_DATE_FILE = "#{TRANSLATIONS_FOLDER_PATH}/version-date".freeze

  private def translations_metadata
    @@metadata_cache ||= []
    build_hash = current_build_hash

    if @@metadata_cache.empty? || build_hash != @@cached_for_hash
      metadata_files = Dir.glob("#{TRANSLATIONS_FOLDER_PATH}/*/metadata.json")
      metadata_index = metadata_files.index_by { |file| File.basename(File.dirname(file)) }
                                     .transform_values { |file| File.read(file).strip }
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
    File.read(TRANSLATIONS_HASH_FILE).strip
  end

  private def current_base_version
    File.read(TRANSLATIONS_DATE_FILE).strip
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
