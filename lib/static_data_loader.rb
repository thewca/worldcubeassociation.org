# frozen_string_literal: true

module StaticDataLoader
  class << self
    attr_accessor :started
  end

  DEFAULT_EXPORT_MODELS = [
    Country,
    Continent,
    Format,
    PreferredFormat,
    Event,
    RoundType,
    EligibleCountryIso2ForChampionship,
  ].freeze

  EXPORT_FOLDER = Rails.root.join('lib/static_data')

  def self.listen_backend(
    export_folder = EXPORT_FOLDER,
    *models,
    run_on_start: false
  )
    return unless Rails.env.development?
    return if started

    self.started = true

    model_names = models.map { |klass| klass.name.underscore }
    debug("Watching #{model_names.inspect}")

    models.each { |model| install_model_listener(model, export_folder) }

    self.export_backend(export_folder, *models) if run_on_start
  end

  def self.import_backend(*models)
    models.each { |model| load_entities(model) }
  end

  def self.export_backend(
    export_folder = EXPORT_FOLDER,
    *models
  )
    FileUtils.mkdir_p(export_folder) unless File.directory?(export_folder)

    models.each { |model| write_entities(model, export_folder) }
  end

  def self.debug(message)
    logger.tagged("frontend-model") { logger.debug(message) }
  end

  def self.logger
    @logger ||= ActiveSupport::TaggedLogging.new(Rails.logger)
  end

  def self.install_model_listener(model, export_folder)
    klass = self

    model.after_commit do
      klass.debug("Detected DB commit to #{self}. Exporting to static data file")
      klass.write_entities(self, export_folder)
    end
  end

  def self.write_entities(model, export_path)
    model_data = ::JSON.pretty_generate(model.all.as_json)
    file_name = "#{model.data_file_handle}.json"

    output_path = File.join(export_path, file_name)

    # Don't rewrite the file if it already exists and has the same content.
    # It helps the asset pipeline or webpack understand that file wasn't changed.
    if File.exist?(output_path) && File.read(output_path) == model_data
      return
    end

    debug("Writing JSON data for #{model.name.underscore} to #{output_path}")
    File.write(output_path, model_data)
  end

  def self.load_entities(model)
    model.upsert_all(model.raw_static_data)
  end
end
