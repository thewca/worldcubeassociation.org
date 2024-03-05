# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: WcaOnRails::Application.config.default_from_address
  layout 'mailer'
  helper :application
end
