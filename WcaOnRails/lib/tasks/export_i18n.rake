# frozen_string_literal: true

Rake::Task['webpacker:compile'].enhance ['i18n:js:export']
