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

  FRONTEND_EXPORT_FOLDER = Rails.root.join('app/webpacker/rails_data')

  def self.listen_frontend(
    export_folder = FRONTEND_EXPORT_FOLDER,
    *models,
    run_on_start: true
  )
    return unless Rails.env.development?
    return if started

    self.started = true

    model_names = models.map { |klass| klass.name.underscore }
    debug("Watching #{model_names.inspect}")

    models.each { |model| install_frontend_listener(model, export_folder) }

    self.export(export_folder, *models) if run_on_start
  end

  def self.export(
    export_folder = FRONTEND_EXPORT_FOLDER,
    *models
  )
    FileUtils.mkdir_p(export_folder) unless File.directory?(export_folder)

    models.each { |model| write_frontend(model, model.all.as_json, export_folder) }
  end

  def self.debug(message)
    logger.tagged("frontend-model") { logger.debug(message) }
  end

  def self.logger
    @logger ||= ActiveSupport::TaggedLogging.new(Rails.logger)
  end

  def self.install_frontend_listener(model, export_folder)
    klass = self

    model.after_commit do
      klass.debug("Detected DB commit to #{self}. Exporting to JS data file")
      klass.write_frontend(self, self.all.as_json, export_folder)
    end
  end

  def self.write_frontend(model, serialized_entities, export_path)
    model_data = ::JSON.pretty_generate(serialized_entities)
    file_name = "#{model.table_name.underscore}.json"

    output_path = File.join(export_path, file_name)

    # Don't rewrite the file if it already exists and has the same content.
    # It helps the asset pipeline or webpack understand that file wasn't changed.
    if File.exist?(output_path) && File.read(output_path) == model_data
      return
    end

    debug("Writing JSON data for #{model.name.underscore} to #{output_path}")
    File.write(output_path, model_data)
  end
end
