# frozen_string_literal: true

class TranslationsController < ApplicationController
  WEBLATE_URL = "https://translate.worldcubeassociation.org"
  WEBLATE_LANGUAGE_CODES = {
    "es-ES" => "es",
    "es-419" => "es_419",
    "fr-CA" => "fr_CA",
    "pt-BR" => "pt_BR",
    "zh-CN" => "zh_Hans",
    "zh-TW" => "zh_Hant",
  }.freeze

  def index
    @weblate_codes = (I18n.available_locales - [:en]).sort.index_with { WEBLATE_LANGUAGE_CODES.fetch(it.to_s, it.to_s) }
  end
end
