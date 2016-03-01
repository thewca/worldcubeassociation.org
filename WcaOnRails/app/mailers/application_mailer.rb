class ApplicationMailer < ActionMailer::Base
  default from: WcaOnRails::Application.config.default_from_address
  layout 'mailer'
end
