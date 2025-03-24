# frozen_string_literal: true

if Rails.env.local?
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins '*'

      resource '*',
               headers: :any,
               expose: %i[Authorization Total Per-Page Link],
               methods: :any
    end
  end
else
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins '*'

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

    allow do
      origins 'https://worldcubeassociation.org', 'https://staging.worldcubeassociation.org'

      resource(
        '/api/internal/*',
        headers: %w[Origin X-Requested-With Content-Type Accept Authorization],
        methods: %i[get post delete put patch options head],
        max_age: 0,
        credentials: false,
      )
    end
  end
end
