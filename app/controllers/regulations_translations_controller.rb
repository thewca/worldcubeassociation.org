# frozen_string_literal: true

class RegulationsTranslationsController < RegulationsController
  REGULATIONS_TRANSLATIONS_VERSION_FILE = "translations/version"

  def render_translated_regulations(route, language)
    render_regulations("translations/#{language}/#{route}", REGULATIONS_TRANSLATIONS_VERSION_FILE)
  end

  def translated_regulation
    render_translated_regulations("index.html.erb", params[:language])
  end

  def translated_guidelines
    render_translated_regulations("guidelines.html.erb", params[:language])
  end

  def translated_pdfs
    respond_to do |format|
      format.pdf do
        return redirect_to "https://regulations.worldcubeassociation.org/translations/#{params[:language]}/#{params[:pdf]}.pdf", status: 302, allow_other_host: true
      end
    end
  end
end
