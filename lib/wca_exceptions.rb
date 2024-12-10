# frozen_string_literal: true

module WcaExceptions
  class ApiException < StandardError
    attr_reader :status
    def initialize(status, error_str)
      super(error_str)
      @status = status
    end
  end

  class BadApiParameter < ApiException
    def initialize(error_str)
      super(:unprocessable_entity, error_str)
    end
  end

  class NotFound < ApiException
    def initialize(error_str)
      super(:not_found, error_str)
    end
  end

  class MustLogIn < ApiException
    def initialize
      super(:unauthorized, I18n.t('api.login_message'))
    end
  end

  class NotPermitted < ApiException
    def initialize(error_str)
      super(:forbidden, error_str)
    end
  end

  class RegistrationError < ApiException
    attr_reader :error_code, :error, :data

    def initialize(status, error, data = nil)
      super(status, I18n.t("competitions.registration_v2.errors.#{error}"))
      @error = error
      @data = data
    end
  end

  class BulkUpdateError < StandardError
    attr_reader :status, :errors

    def initialize(status, errors)
      super('Errors detected in bulk update request. See `errors` attribute for more information.')
      @status = status
      @errors = errors
    end
  end
end
