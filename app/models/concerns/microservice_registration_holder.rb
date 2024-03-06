# frozen_string_literal: true

module MicroserviceRegistrationHolder
  extend ActiveSupport::Concern

  included do
    has_many :microservice_registrations
  end

  def microservice_registrations
    # Query most recent registrations, which triggers caching of the `microservice_registration` AR model
    case self.model_name.to_s
    when Competition.model_name.to_s
      ms_models = Microservices::Registrations.registrations_by_competition(self.id)
    when User.model_name.to_s
      ms_models = Microservices::Registrations.registrations_by_user(self.id)
    else
      raise "Unsupported model #{self.model_name} as MicroserviceRegistrationHolder. Currently supported are: #{Competition.model_name}, #{User.model_name}"
    end

    # Let Rails do its thing via the `has_many` association defined at the top of the file
    super.tap do |ar_models|
      ar_models.each do |ar_model|
        matching_ms_model = ms_models.find { |ms_model| ms_model['competition_id'] == ar_model.competition_id && ms_model['user_id'] == ar_model.user_id }
        ar_model.load_ms_model(matching_ms_model)
      end
    end
  end
end
