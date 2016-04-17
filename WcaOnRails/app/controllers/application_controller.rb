require "newrelic_rpm"

class ApplicationController < ActionController::Base
  include TimeWillTell::Helpers::DateRangeHelper
  protect_from_forgery with: :exception

  before_action :add_new_relic_headers
  protected def add_new_relic_headers
    ::NewRelic::Agent.add_custom_attributes({ user_id: current_user ? current_user.id : nil })
    ::NewRelic::Agent.add_custom_attributes({ HTTP_REFERER: request.headers['HTTP_REFERER'] })
    ::NewRelic::Agent.add_custom_attributes({ HTTP_ACCEPT: request.headers['HTTP_ACCEPT'] })
    ::NewRelic::Agent.add_custom_attributes({ HTTP_USER_AGENT: request.user_agent })
  end

  def doorkeeper_unauthorized_render_options(error: nil)
    { json: { error: "Not authorized" } }
  end

  before_action :configure_permitted_parameters, if: :devise_controller?
  protected def configure_permitted_parameters
    devise_parameter_sanitizer.for(:sign_up) <<
      :name <<
      :email <<
      :dob <<
      :gender <<
      :country_iso2
    User::CLAIM_WCA_ID_PARAMS.each do |p|
      devise_parameter_sanitizer.for(:sign_up) << p
    end
    devise_parameter_sanitizer.for(:sign_in) << :login
    devise_parameter_sanitizer.for(:account_update) << :name << :email
  end

  private def redirect_unless_user(action, *args)
    unless current_user && current_user.send(action, *args)
      flash[:danger] = "You are not allowed to #{action.to_s.sub(/^can_/, '').chomp('?').humanize.downcase}"
      redirect_to root_url
    end
  end

  def date_range(from_date, to_date, options={})
    options[:separator] = '-'
    options[:format] = :long
    super(from_date, to_date, options)
  end
end
