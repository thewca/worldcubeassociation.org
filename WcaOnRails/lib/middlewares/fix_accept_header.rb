# frozen_string_literal: true

module Middlewares
  class FixAcceptHeader
    def initialize(app)
      @app = app
    end

    def call(env)
      if env["HTTP_ACCEPT"] == "*/*;"
        env["HTTP_ACCEPT"] = "*/*"
      end

      @app.call(env)
    end
  end
end
