# frozen_string_literal: true

class Api::V0::RegulationsController < Api::V0::ApiController
  def translations
    if Rails.env.local?
      return render json: { current: [{ version: "2025-01-01", language: "简体中文", language_english: "Chinese", url: "./chinese" },
                                      { version: "2025-01-01", language: "Nederlands", language_english: "Dutch", url: "./dutch" },
                                      { version: "2025-01-01", language: "Tiếng Việt", language_english: "Vietnamese", url: "./vietnamese" }],
                            outdated: [{ version: "2024-01-01", language: "Svenska", language_english: "Swedish", url: "./swedish" },
                                       { version: "2023-08-01", language: "Русский", language_english: "Russian", url: "./russian" },
                                       { version: "2015-07-01", language: "Português Europeu", language_english: "Portuguese, Europe", url: "./portuguese-european" },
                                       { version: "2014-01-01", language: "Беларуская мова", language_english: "Belarusian", url: "./belarusian" }] }
    end

    render json: { current: helpers.current_reg_translations, outdated: helpers.outdated_reg_translations }
  end
end
