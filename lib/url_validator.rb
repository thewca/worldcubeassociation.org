# frozen_string_literal: true

class UrlValidator < ActiveModel::EachValidator
  URL_RE = %r{\Ahttps?://\S+\z}
  VALID_URL_MESSAGE = "must be a valid url starting with http:// or https://"

  def validate_each(record, attribute, value)
    record.errors.add(attribute, VALID_URL_MESSAGE) if value.present? && !URL_RE.match(value)
  end
end
