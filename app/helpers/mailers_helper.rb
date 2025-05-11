# frozen_string_literal: true

module MailersHelper
  def localized_mail(locale, subject_lambda, **headers, &)
    I18n.with_locale locale do
      headers[:subject] = subject_lambda.call
      mail(headers, &)
    end
  end
end
