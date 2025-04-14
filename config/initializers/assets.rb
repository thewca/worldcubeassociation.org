# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
Rails.application.config.assets.precompile += %w(oms.js)
Rails.application.config.assets.precompile += %w(email.css)
Rails.application.config.assets.precompile += %w(pdf.css)
(I18n.available_locales - [:en]).each do |locale|
  Rails.application.config.assets.precompile += ["locales/#{locale.downcase}.js"]
end
