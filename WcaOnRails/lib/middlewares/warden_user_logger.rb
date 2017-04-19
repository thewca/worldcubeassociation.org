# frozen_string_literal: true

module Middlewares
  class WardenUserLogger
    def initialize(app, logger:)
      @app = app
      @logger = logger
    end

    def call(env)
      warden_user = env['warden'].user
      begin
        response = @app.call(env)
      ensure
        @logger.call "[User Id] Request was made by user id: #{warden_user ? warden_user.id : "<not logged in>"}"
      end
      response
    end
  end
end
