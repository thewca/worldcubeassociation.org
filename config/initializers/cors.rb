# frozen_string_literal: true

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'

    if Rails.env.local?
      resource '*',
               headers: :any,
               expose: %i[Authorization Total Per-Page Link],
               methods: :any
    else
      resource(
        '/api/v0/*',
        headers: %w[Origin X-Requested-With Content-Type Accept Authorization],
        methods: %i[get post delete put patch options head],
        expose: %w[Total Per-Page Link],
        max_age: 0,
        credentials: false,
        )

      resource(
        '/api/v1/*',
        headers: %w[Origin X-Requested-With Content-Type Accept Authorization],
        methods: %i[get post delete put patch options head],
        expose: %w[Total Per-Page Link],
        max_age: 0,
        credentials: false,
        )
    end
  end
end
