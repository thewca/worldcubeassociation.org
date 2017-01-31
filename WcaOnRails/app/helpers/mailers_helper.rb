# frozen_string_literal: true
module MailersHelper
  def localized_mail(locale, headers = {}, &block)
    I18n.with_locale locale do
      mail(headers, &block)
    end
  end
end
