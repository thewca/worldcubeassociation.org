# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Add new mime types for use in respond_to blocks:
# Mime::Type.register "text/richtext", :rtf
Mime::Type.register 'text/plain', :txt

# As of Rails 7, Markdown is no longer recognized as default template type
# but we rely on it for our Delegate Reports. Manually register so that the rendering engine finds .md files.
Mime::Type.register 'text/markdown', :md
