# frozen_string_literal: true

# Copied from https://github.com/doorkeeper-gem/doorkeeper/wiki/Associate-users-to-OAuth-applications-%28ownership%29#controllers
class Oauth::ApplicationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_application, only: %i[show edit update destroy]

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
    @application = Doorkeeper::Application.find(params[:id])
    # Don't let users view or edit applications they don't own,
    # unless they're an admin.
    raise ActionController::RoutingError.new('Not Found') if @application.owner != current_user && !current_user.admin?
  end

  private def application_params
    params.expect(doorkeeper_application: %i[name redirect_uri scopes])
  end
end
