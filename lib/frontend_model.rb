# frozen_string_literal: true

module FrontendModel
  class << self
    attr_accessor :started
  end

  DEFAULT_EXPORT_FOLDER = Rails.root.join('app/webpacker/rails_data')

  DEFAULT_EXPORT_MODELS = [
    Country,
    Continent,
    Format,
    Event,
    RoundType,
    EligibleCountryIso2ForChampionship,
  ].freeze

  def self.listen(
    export_folder = DEFAULT_EXPORT_FOLDER,
    *models,
    run_on_start: true
  )
    return unless Rails.env.development?
    return if started

    self.started = true

    model_names = models.map { |klass| klass.name.underscore }
    debug("Watching #{model_names.inspect}")

    models.each { |model| install_listener(model, export_folder) }

    self.export(export_folder, *models) if run_on_start
  end

  def self.export(
    export_folder = DEFAULT_EXPORT_FOLDER,
    *models
  )
    FileUtils.mkdir_p(export_folder) unless File.directory?(export_folder)

    models.each { |model| write_entities(model, export_folder) }
  end

  def self.relative_path(path)
    Pathname.new(path).relative_path_from(Rails.root).to_s
  end

  def self.debug(message)
    logger.tagged("frontend-model") { logger.debug(message) }
  end

  def self.logger
    @logger ||= ActiveSupport::TaggedLogging.new(Rails.logger)
  end

  def self.install_listener(model, export_folder)
    klass = self

    model.after_commit do
      klass.debug("Detected DB commit to #{model}. Exporting to JS data file")
      klass.write_entities(model, export_folder)
    end
  end

  def self.write_entities(model, export_path)
    base_data = model.all.map do |entity|
      entity.as_json.tap do |data|
        data.merge!(real: entity.real?) if model < LocalizedSortable
        data.merge!(official: entity.official?) if entity.respond_to?(:official?)
      end
    end

    model_data = ::JSON.pretty_generate(base_data)
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
