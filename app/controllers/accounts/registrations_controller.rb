# frozen_string_literal: true

class Accounts::RegistrationsController < Devise::RegistrationsController
  before_action :check_captcha, only: [:create]

  protected def after_update_path_for(_resource)
    edit_user_registration_path
  end

  def create
    super do |resource|
      next unless resource.persisted?
      next if resource.delegate_to_handle_wca_id_claim.nil?

      TicketsClaimWcaId.create_ticket!(resource)
    end
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
