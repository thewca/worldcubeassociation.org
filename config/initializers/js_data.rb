# frozen_string_literal: true

# heavily inspired by https://github.com/fnando/i18n-js/
Rails.application.config.after_initialize do
  # This will only run in development.
  if Rails.env.development?
    StaticDataLoader.listen_backend(
      StaticDataLoader::EXPORT_FOLDER,
      *StaticDataLoader::DEFAULT_EXPORT_MODELS,
    )
  end
end
