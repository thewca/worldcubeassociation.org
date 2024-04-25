# frozen_string_literal: true

class CreateTranslatorsGroup < ActiveRecord::Migration[7.1]
  # rubocop:disable Style/NumericLiterals
  VERIFIED_TRANSLATORS_BY_LOCALE = {
    "ca" => [94007, 15295],
    "cs" => [8583],
    "da" => [6777],
    "de" => [870, 7121, 7139],
    "eo" => [1517],
    "es" => [7340, 1439],
    "fi" => [39072],
    "fr" => [277],
    "hr" => [46],
    "hu" => [368],
    "id" => [1285],
    "it" => [19667],
    "ja" => [32229, 1118],
    "kk" => [201680],
    "ko" => [14],
    "nl" => [1, 41519],
    "pl" => [6008, 1686],
    "pt" => [331],
    "pt-BR" => [18],
    "ro" => [11918],
    "ru" => [140, 1492],
    "sk" => [7922],
    "sl" => [1381],
    "sv" => [17503],
    "th" => [21095],
    "uk" => [296],
    "vi" => [7158],
    "zh-CN" => [9],
    "zh-TW" => [38, 77608],
  }.freeze
  # rubocop:enable Style/NumericLiterals
  def change
    user_group = UserGroup.create!(name: 'Translators', group_type: :translators, is_active: true, is_hidden: true)
    CreateTranslatorsGroup::VERIFIED_TRANSLATORS_BY_LOCALE.flat_map do |locale, user_ids|
      user_ids.map do |user_id|
        metadata = GroupsMetadataTranslators.create!(locale: locale)
        UserRole.create!(
          user_id: user_id,
          group_id: user_group.id,
          start_date: '2017-01-30',
          metadata: metadata,
        )
      end
    end
  end
end
