# frozen_string_literal: true

Rails.autoloaders.main.ignore(Rails.root.join('app/webpacker'))
Rails.autoloaders.main.ignore(Rails.root.join('lib/tasks'))

if Rails.env.production?
  Rails.autoloaders.main.ignore(Rails.root.join('lib/custom_wca_i18n_scanner.rb'))
end

Rails.autoloaders.main.inflector.inflect 'json_schemas' => 'JSONSchemas'
