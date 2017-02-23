# frozen_string_literal: true
SwaggerEngine.configure do |config|
  config.swaggers = {
    v0: "public/api/v0/swagger.yaml",
  }
end
