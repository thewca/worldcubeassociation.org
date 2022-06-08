# frozen_string_literal: true

class RegionalOrganizationsController < ApplicationController
  before_action :authenticate_user!, except: [:index]
  before_action -> { redirect_to_root_unless_user(:can_manage_regional_organizations?) }, except: [:index, :new, :create]

  def admin
    @regional_organizations = RegionalOrganization.all.order(country: :asc)
  end

  def index
    @acknowledged_regional_organizations = RegionalOrganization.currently_acknowledged.order(country: :asc)
    @img_paths = []
    @acknowledged_regional_organizations.each do |ro|
      if ro.logo.attached?
        @img_paths.append(polymorphic_url(ro.logo.variant(resize: "500x300")))
      else
        @img_paths.append("")
      end
    end
  end

  def new
    @regional_organization = RegionalOrganization.new
  end

  def edit
    @regional_organization = regional_organization_from_params
  end

  def update
    @regional_organization = regional_organization_from_params

    if @regional_organization.update(regional_organization_params)
      flash[:success] = "Successfully updated Regional Organization!"
      redirect_to edit_regional_organization_path(@regional_organization)
    else
      render :edit
    end
  end

  def destroy
    @regional_organization = regional_organization_from_params
    if @regional_organization.is_pending?
      if @regional_organization.destroy
        flash[:success] = "Successfully deleted Regional Organization!"
      else
        flash[:danger] = "Unable to delete Regional Organization"
      end
    else
      flash[:danger] = "Unable to delete Regional Organization because it is not pending"
    end
    redirect_to admin_regional_organizations_path
  end

  def create
    @regional_organization = RegionalOrganization.new(regional_organization_params)

    @regional_organization.logo.attach(params[:regional_organization][:logo])
    @regional_organization.bylaws.attach(params[:regional_organization][:bylaws])
    @regional_organization.extra_file.attach(params[:regional_organization][:extra_file])
    if @regional_organization.save
      flash[:success] = t('.create_success')
      RegionalOrganizationsMailer.notify_board_and_assistants_of_new_regional_organization_application(current_user, @regional_organization).deliver_later
      if current_user.can_manage_regional_organizations?
        redirect_to edit_regional_organization_path(@regional_organization)
      else
        redirect_to root_url
      end
    else
      @regional_organization.errors[:id].each { |error| @regional_organization.errors.add(:name, error) }
      render :new
    end
  end

  private def regional_organization_params
    permitted_regional_organization_params = [
      :name,
      :country,
      :website,
      :logo,
      :email,
      :address,
      :bylaws,
      :directors_and_officers,
      :area_description,
      :past_and_current_activities,
      :future_plans,
      :extra_information,
      :extra_file,
    ]

    if current_user.can_manage_regional_organizations?
      permitted_regional_organization_params += [
        :start_date,
        :end_date,
      ]
    end

    params.require(:regional_organization).permit(*permitted_regional_organization_params)
  end

  private def regional_organization_from_params
    RegionalOrganization.find(params[:id])
  end
end
