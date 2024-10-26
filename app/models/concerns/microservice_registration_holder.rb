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

    # Let Rails do its thing via the `has_many` association defined at the top of the file, but with a little extra
    super.all.extending do
      # Tap into the Rails ActiveRecord engine to make sure that when records are actually loaded
      # (i.e. after querying is completely done and the records are _just about_ to be retrieved from the DB)
      define_method :records do
        super().tap do |ar_models|
          # we hydrate each model with the microservice information directly from above
          ar_models.each do |ar_model|
            matching_ms_model = ms_models.find { |ms_model| ms_model['competition_id'] == ar_model.competition_id && ms_model['user_id'] == ar_model.user_id }

            if !matching_ms_model.present? && ar_model.is_competing?
              raise "No matching Microservice registration found: Row ID #{ar_model.id}, competition '#{ar_model.competition_id}', user '#{ar_model.user_id}'. " \
                    "This means the microservice suddenly 'forgot' about an entry that it told us about before, and it should not happen!"
            end

            ar_model.load_ms_model(matching_ms_model) if matching_ms_model.present?

            # Give the option to fetch data later, for example when instantiation on the MS side of things is deferred.
            ar_model.lazy_loading_enabled = !matching_ms_model.present?
          end
        end
      end
    end
  end

  private def scoped_find_by(scope, **kwargs)
    eligible_associations = self.class.reflect_on_all_associations.filter { |assoc|
      # Pick only associations that point to this current model
      assoc.inverse_of&.plural_name == self.class.model_name.plural
    }

    preload_keys = eligible_associations.filter { |assoc|
      # Pick by the name or the foreign key of the association
      kwargs.keys.include?(assoc.name) || kwargs.keys.include?(assoc.foreign_key)
    }.map(&:name)

    own_assoc_key = self.class.model_name.element.to_sym

    scope.includes(own_assoc_key, *preload_keys)
         .find_by(own_assoc_key => self, **kwargs)
  end

  def find_ms_registration_by(**)
    self.scoped_find_by(MicroserviceRegistration, **) || self.scoped_find_by(self.microservice_registrations, **)
  end
end
