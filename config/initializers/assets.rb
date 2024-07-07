# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# This is used exclusively to make cubing icons available for the wicked_pdf
# helper!
# wicked_pdf's helpers can't handle "packs_with_chunks" and therefore cannot
# properly inline our packs :(
Rails.application.config.assets.paths << Rails.root.join('node_modules', '@cubing', 'icons', 'www', 'css')

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
Rails.application.config.assets.precompile += %w(oms.js)
Rails.application.config.assets.precompile += %w(email.css)
Rails.application.config.assets.precompile += %w(pdf.css)
(I18n.available_locales - [:en]).each do |locale|
  Rails.application.config.assets.precompile += ["locales/#{locale.downcase}.js"]
end
