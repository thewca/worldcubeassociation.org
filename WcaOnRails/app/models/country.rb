# frozen_string_literal: true
class Country < ApplicationRecord
  include Cachable
  self.table_name = "Countries"

  belongs_to :continent, foreign_key: :continentId
  has_many :competitions, foreign_key: :countryId

  scope :uncached_real, -> { where.not(id: %w(XA XE XS)) }

  def name
    I18n.t(iso2, scope: :countries)
  end

  def name_in(locale)
    I18n.t(iso2, scope: :countries, locale: locale)
  end

  def self.real
    @real_countries ||= Country.uncached_real
  end

  def real?
    !%w(XA XE XS).include?(id)
  end

  def self.find_by_iso2(iso2)
    c_all_by_id.values.select { |c| c.iso2 == iso2 }.first
  end

  def self.localized_sort_by!(wca_locale, array, &block)
    # Unfortunately, it looks like the set of languages supported by
    # twitter-cldr-rb is not exactly the same as the languages we support, so I
    # had to add special mappings for pt-BR, zh-CN, and zh-TW.

    # https://www.w3.org/International/articles/language-tags/ says:
    # "Although for common uses of language tags it is not likely that you will need
    # to specify the script, there are one or two situations that have been
    # crying out for it for some time. One such example is Chinese. There are
    # many Chinese dialects, often mutually unintelligible, but these dialects
    # are all written using either Simplified or Traditional Chinese script.
    # People typically want to label Chinese text as either Simplified or
    # Traditional, but until recently there was no way to do so. People had to
    # bend something like zh-CN (meaning Chinese as spoken in China) to mean
    # Simplified Chinese, even in Singapore, and zh-TW (meaning Chinese as
    # spoken in Taiwan) for Traditional Chinese. (Other people, however, use
    # zh-HK for Traditional Chinese.) The availability of zh-Hans and zh-Hant
    # for Chinese written in Simplified and Traditional scripts should improve
    # consistency and accuracy, and is already becoming widely used, although
    # of course you may need to continue to use the old language tags in some
    # cases for consistency."

    # So it is tempting to say that we should rename our locales as follows:
    # zh-CN -> zh-Hans and zh-Tw -> zh-Hant

    # However, Devise and Rails contain a lot of translations we use, and they
    # also use zh-CN and zh-TW, so we probably want to stick with those.

    cldr_locale = {
      'pt-BR': 'pt',
      'zh-CN': 'zh',
      'zh-TW': 'zh-Hant',
      # See https://github.com/thewca/worldcubeassociation.org/issues/1339
      'sl': 'hr',
    }.fetch(wca_locale, wca_locale)

    collator = TwitterCldr::Collation::Collator.new(cldr_locale)

    array.sort_by! { |element| collator.get_sort_key(block.call(element)) }
  end

  ALL_SORTED_BY_LOCALE = Hash[I18n.available_locales.map do |locale|
    countries = localized_sort_by!(locale, Country.all.to_a) { |country| country.name_in(locale) }
    [locale, countries]
  end].freeze

  def self.all_sorted_by(locale, real: false)
    real ? ALL_SORTED_BY_LOCALE[locale].select(&:real?) : ALL_SORTED_BY_LOCALE[locale]
  end
end
