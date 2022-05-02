# frozen_string_literal: true

Rails.autoloaders.main.ignore(Rails.root.join('app/webpacker'))
Rails.autoloaders.main.ignore(Rails.root.join('lib/tasks'))

Rails.autoloaders.main.inflector.inflect "json_schemas" => "JSONSchemas"
