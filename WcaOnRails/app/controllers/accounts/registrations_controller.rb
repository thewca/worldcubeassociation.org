# frozen_string_literal: true

class Accounts::RegistrationsController < Devise::RegistrationsController
  before_action :check_captcha, only: [:create]
  protected def after_update_path_for(resource)
    edit_user_registration_path
  end

  private

  def check_captcha
    return if verify_recaptcha
    self.resource = resource_class.new sign_up_params
    # resource.validate
    set_minimum_password_length
    respond_with_navigational(resource) do
      flash.now[:recaptcha_error] = flash[:recaptcha_error]
      render :new
    end
  end
end
