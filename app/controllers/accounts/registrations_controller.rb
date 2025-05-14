# frozen_string_literal: true

class Accounts::RegistrationsController < Devise::RegistrationsController
  # We delegate the create method to the super class
  # rubocop:disable Rails/LexicallyScopedActionFilter
  before_action :check_captcha, only: [:create]
  # rubocop:enable Rails/LexicallyScopedActionFilter
  protected def after_update_path_for(resource)
    edit_user_registration_path
  end

  private

    def check_captcha
      return if verify_recaptcha

      build_resource(sign_up_params)
      resource.validate

      clean_up_passwords resource
      set_minimum_password_length

      respond_with_navigational(resource) do
        flash.now[:recaptcha_error] = flash[:recaptcha_error]
        render :new
      end
    end
end
