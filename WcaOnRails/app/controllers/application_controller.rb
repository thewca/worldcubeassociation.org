class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected def configure_permitted_parameters
    devise_parameter_sanitizer.for(:sign_up) << :name << :email
    devise_parameter_sanitizer.for(:sign_in) << :login
    devise_parameter_sanitizer.for(:account_update) << :name
  end

  private def can_admin_results_only
    unless current_user && current_user.can_admin_results?
      flash[:danger] = "You are not allowed to administer results"
      redirect_to root_url
    end
  end
end
