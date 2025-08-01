# frozen_string_literal: true

require "newrelic_rpm"

class ApplicationController < ActionController::Base
  include TimeWillTell::Helpers::DateRangeHelper
  include Devise::Controllers::StoreLocation

  protect_from_forgery with: :exception, unless: :oauth_request?

  prepend_before_action :set_locale, unless: :ignore_client_language?
  # The API should only ever respond in English
  prepend_before_action :set_default_locale, if: :ignore_client_language?

  before_action :store_user_location!, if: :storable_location?
  before_action :add_new_relic_headers
  protected def add_new_relic_headers
    ::NewRelic::Agent.add_custom_attributes(user_id: current_user&.id)
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

  def set_default_locale
    I18n.locale = I18n.default_locale
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
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[
      name
      email
      dob
      gender
      country_iso2
    ] + User::CLAIM_WCA_ID_PARAMS)
    devise_parameter_sanitizer.permit(:sign_in, keys: %i[login otp_attempt])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[name email])
  end

  # This method is called by devise after a successful login to know the redirect path
  # We override it to do some action after signing in, but we want to use the original path
  protected def after_sign_in_path_for(resource_or_scope)
    # When the user signs in, 'session[:locale]' is not cleared, so we need to clear it
    # and compute again the user's preferred_locale
    session[:locale] = nil
    set_locale

    super
  end

  # This method is called by devise after a successful logout to know the redirect path
  # We override it to do some action after signing out, but we want to use the original path
  protected def after_sign_out_path_for(resource_or_scope)
    session[:should_reset_jwt] = true
    super
  end

  # Starburst announcements, see https://github.com/starburstgem/starburst#installation
  helper Starburst::AnnouncementsHelper

  private

    def redirect_to_root_unless_user(action, *)
      redirecting = !current_user&.send(action, *)
      if redirecting
        flash[:danger] = if action == :has_permission?
                           t("errors.messages.no_permission")
                         else
                           "You are not allowed to #{action.to_s.sub(/^can_/, '').chomp('?').humanize.downcase}"
                         end
        redirect_to root_url
      end
      redirecting
    end

    # For redirecting user to source after login - https://github.com/heartcombo/devise/wiki/How-To:-Redirect-back-to-current-page-after-sign-in,-sign-out,-sign-up,-update
    def storable_location?
      request.get? && is_navigational_format? && !devise_controller? && !request.xhr? && !api_request?
    end

    def ignore_client_language?
      api_request? || oauth_request?
    end

    def oauth_request?
      # Checking the fullpath alone is not enough: The user-facing UI to manage OAuth applications
      #   and the "Approve" / "Deny" buttons for incoming OAuth requests also live under `/oauth/` routes.
      #   So we also check the controller inheritance chain because Doorkeeper conveniently distinguishes the "metal" controller.
      request.fullpath.include?('/oauth/') && self.class.ancestors.include?(Doorkeeper::ApplicationMetalController)
    end

    def api_request?
      request.fullpath.include?('/api/')
    end

    def store_user_location!
      # :user is the scope we are authenticating
      store_location_for(:user, request.fullpath)
    end
end
