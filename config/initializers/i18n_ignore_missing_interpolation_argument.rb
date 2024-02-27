# frozen_string_literal: true

I18n.config.missing_interpolation_argument_handler = lambda do |missing_key, provided_hash, string|
  if I18n.locale == :en
    # We only want to raise exceptions for English. This allows development to continue
    # in English, without being held up by slow translations.
    #  https://github.com/thewca/worldcubeassociation.org/issues/1259
    raise MissingInterpolationArgument.new(missing_key, provided_hash, string)
  else
    "UNKNOWN_INTERPOLATION_KEY_FOUND_IN_TRANSLATION (#{missing_key})"
  end
end
