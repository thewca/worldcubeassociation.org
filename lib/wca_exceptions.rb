# frozen_string_literal: true

module WcaExceptions
  class ApiException < StandardError
    attr_reader :status, :error_details

    def initialize(status, error_str, **error_details)
      super(error_str)
      @status = status
      @error_details = error_details
    end
  end

  class BadApiParameter < ApiException
    def initialize(error_str, json_property: nil)
      super(:unprocessable_entity, error_str, json_property: json_property)
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
