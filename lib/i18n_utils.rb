# frozen_string_literal: true

module I18nUtils
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
    }.fetch(wca_locale, wca_locale)

    collator = TwitterCldr::Collation::Collator.new(cldr_locale)

    array.sort_by! { |element| collator.get_sort_key(block.call(element)) }
  end
end
