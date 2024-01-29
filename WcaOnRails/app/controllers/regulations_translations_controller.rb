# frozen_string_literal: true

class RegulationsTranslationsController < ApplicationController
  before_action :ensure_trailing_slash

  REGULATIONS_TRANSLATIONS_VERSION_FILE = "translations/version"

  # We need this so the links for the translated guidelines work
  private def ensure_trailing_slash
    def trailing_slash?(url)
      url.match(/[^?]+/).to_s.last == '/'
    end
    desired_url = url_for(params.permit!.merge(trailing_slash: true))
    # url_for doesn't always add a trailing slash (it won't add a slash to
    # a url like example.com/index.html, for instance).
    # Only attempt to redirect if the current url does not match the one
    # url_for would want.
    if trailing_slash?(request.env['REQUEST_URI']) != trailing_slash?(desired_url)
      redirect_to desired_url, status: 301
    end
  end

  def render_translated_regulations(route, language)
    erb_file = RegulationsS3Helper.fetch_regulations_from_s3("translations/#{language}/#{route}", REGULATIONS_TRANSLATIONS_VERSION_FILE)
    render inline: erb_file, :layout => "application"
  end
  def translated_regulation
    render_translated_regulations("index.html.erb", params[:language])
  end

  def translated_guidelines
    render_translated_regulations("guidelines.html.erb", params[:language])
  end
end
