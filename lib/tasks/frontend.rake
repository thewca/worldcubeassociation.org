# frozen_string_literal: true

namespace :frontend do
  task generate_data: :environment do
    FrontendModel.export(
      FrontendModel::DEFAULT_EXPORT_FOLDER,
      *FrontendModel::DEFAULT_EXPORT_MODELS,
    )
  end
end
