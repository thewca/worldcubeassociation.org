# frozen_string_literal: true

namespace :frontend do
  task generate_data: :environment do
    StaticDataLoader.export_frontend(
      StaticDataLoader::FRONTEND_EXPORT_FOLDER,
      *StaticDataLoader::DEFAULT_EXPORT_MODELS,
    )
  end
end
