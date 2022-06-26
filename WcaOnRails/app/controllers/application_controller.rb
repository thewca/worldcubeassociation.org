# frozen_string_literal: true

require "newrelic_rpm"

class ApplicationController < ActionController::Base
  include TimeWillTell::Helpers::DateRangeHelper
  protect_from_forgery with: :exception

  before_action :add_new_relic_headers, :set_locale
  protected def add_new_relic_headers
    ::NewRelic::Agent.add_custom_attributes(user_id: current_user ? current_user.id : nil)
    ::NewRelic::Agent.add_custom_attributes(HTTP_REFERER: request.headers['HTTP_REFERER'])
    ::NewRelic::Agent.add_custom_attributes(HTTP_ACCEPT: request.headers['HTTP_ACCEPT'])
    ::NewRelic::Agent.add_custom_attributes(HTTP_USER_AGENT: request.user_agent)
  end

  def self.locale_counts
    @@locale_counts
  end

  def set_locale
    # If the locale for the session is not set, we want to infer it from the following sources:
    #  - the current user preferred locale
    #  - the Accept-Language http header
    session[:locale] ||= current_user&.preferred_locale || http_accept_language.language_region_compatible_from(I18n.available_locales)
    I18n.locale = session[:locale] || I18n.default_locale

    @@locale_counts ||= Hash.new(0)
    @@locale_counts[I18n.locale] += 1
  end

  def update_locale
    # Validate the requested locale by looking at those available
    if params[:locale] && I18n.available_locales.include?(params[:locale].to_sym)
      session[:locale] = params[:locale]

      # Display the success message in the new language!
      if current_user.nil? || current_user.update(preferred_locale: session[:locale])
        flash[:success] = I18n.t('users.update_locale.success', locale: session[:locale])
      else
        flash[:danger] = I18n.t('users.update_locale.failure')
      end
    else
      flash[:danger] = I18n.t('users.update_locale.unavailable')
    end
    redirect_to params[:current_url] || root_path
  end

  # https://github.com/doorkeeper-gem/doorkeeper/wiki/Customizing-the-response-body-when-unauthorized
  def doorkeeper_unauthorized_render_options(error: nil)
    { json: { error: "Not authorized" } }
  end

  before_action :configure_permitted_parameters, if: :devise_controller?
  protected def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [
      :name,
      :email,
      :dob,
      :gender,
      :country_iso2,
    ] + User::CLAIM_WCA_ID_PARAMS)
    devise_parameter_sanitizer.permit(:sign_in, keys: [:login, :otp_attempt])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :email])
  end

  # This method is called by devise after a successful login to know the redirect path
  # We override it to do some action after signing in, but we want to use the original path
  protected def after_sign_in_path_for(resource)
    # When the user signs in, 'session[:locale]' is not cleared, so we need to clear it
    # and compute again the user's preferred_locale
    session[:locale] = nil
    set_locale
    super
  end

  private def redirect_to_root_unless_user(action, *args)
    redirecting = !current_user&.send(action, *args)
    if redirecting
      flash[:danger] = "You are not allowed to #{action.to_s.sub(/^can_/, '').chomp('?').humanize.downcase}"
      redirect_to root_url
    end
    redirecting
  end

  # Starburst announcements, see https://github.com/starburstgem/starburst#installation
  # helper Starburst::AnnouncementsHelper
end
