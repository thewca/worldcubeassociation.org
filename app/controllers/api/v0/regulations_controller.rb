# frozen_string_literal: true

class Api::V0::RegulationsController < Api::V0::ApiController
  # Base URL of the statically compiled regulations site, used as a source in
  # development so the endpoint returns real content without S3 credentials.
  REGULATIONS_STATIC_SITE = "https://regulations.worldcubeassociation.org"

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

  def show
    render json: { content_html: regulations_content("index.html.erb") }
  end

  def historical
    render json: { content_html: regulations_content("history/official/#{params[:version]}/index.html.erb") }
  end

  def translation
    render json: {
      content_html: regulations_content(
        "translations/#{params[:language]}/index.html.erb",
        RegulationsTranslationsController::REGULATIONS_TRANSLATIONS_VERSION_FILE,
      ),
    }
  end

  # Fetches the regulations ERB fragment and renders it to a plain HTML string.
  # Rendering consumes the leading `<% provide(:title, ...) %>` tag so only the
  # regulations markup (with its deep-link anchors) is returned to the frontend.
  private def regulations_content(route, version_file = RegulationsController::REGULATIONS_VERSION_FILE)
    render_to_string(inline: fetch_regulations_erb(route, version_file), layout: false)
  end

  private def fetch_regulations_erb(route, version_file)
    if Rails.env.development?
      static_path = route.delete_suffix(".erb")
      Faraday.get("#{REGULATIONS_STATIC_SITE}/#{static_path}").body
    else
      RegulationsS3Helper.fetch_regulations_from_s3(route, version_file)
    end
  end
end
