# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
Rails.application.config.assets.precompile += %w(oms.js)
Rails.application.config.assets.precompile += %w(email.css)
Rails.application.config.assets.precompile += %w(pdf.css)
Rails.application.config.assets.precompile += %w(fullcalendar/fullcalendar_wca.js)
Rails.application.config.assets.precompile += %w(fullcalendar_wca.css)
(I18n.available_locales - [:en]).each do |locale|
  Rails.application.config.assets.precompile += ["locales/#{locale}.js"]
  Rails.application.config.assets.precompile += ["fullcalendar/locales/#{locale}.js"]
end
