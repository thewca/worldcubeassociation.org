# frozen_string_literal: true

# Copied from https://github.com/doorkeeper-gem/doorkeeper/wiki/Associate-users-to-OAuth-applications-%28ownership%29#controllers
class Oauth::ApplicationsController < ApplicationController
  # Third-party registration services have to be vetted by us before they may act on registrations.
  ADMIN_ONLY_SCOPES = %w[manage_registrations].freeze

  before_action :authenticate_user!
  before_action :set_application, only: %i[show edit update destroy]
  before_action :require_admin_for_added_admin_only_scopes!, only: %i[create update]

  def index
    @applications = current_user.admin? ? Doorkeeper::Application.all : current_user.oauth_applications
  end

  def show
  end

  def new
    @application = Doorkeeper::Application.new
  end

  def edit
  end

  def create
    @application = Doorkeeper::Application.new(application_params)
    @application.owner = current_user
    if @application.save
      flash[:notice] = I18n.t('doorkeeper.flash.applications.create.notice')
      redirect_to oauth_application_url(@application)
    else
      render :new
    end
  end

  def update
    if @application.update(application_params)
      flash[:notice] = I18n.t('doorkeeper.flash.applications.update.notice')
      redirect_to oauth_application_url(@application)
    else
      render :edit
    end
  end

  def destroy
    flash[:notice] = I18n.t('doorkeeper.flash.applications.destroy.notice') if @application.destroy
    redirect_to oauth_applications_url
  end

  private def set_application
    @application = Doorkeeper::Application.find(params.require(:id))
    # Don't let users view or edit applications they don't own,
    # unless they're an admin.
    raise ActionController::RoutingError.new('Not Found') if @application.owner != current_user && !current_user.admin?
  end

  private def require_admin_for_added_admin_only_scopes!
    return if current_user.admin?

    # On update, owners may keep an admin-only scope that an admin granted earlier.
    previous_scopes = action_name == 'update' ? @application.scopes.to_a : []
    added_scopes = application_params[:scopes].to_s.split - previous_scopes

    head :forbidden if added_scopes.intersect?(ADMIN_ONLY_SCOPES)
  end

  private def application_params
    params.expect(doorkeeper_application: %i[name redirect_uri scopes])
  end
end
