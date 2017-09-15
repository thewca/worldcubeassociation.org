# frozen_string_literal: true

class IncidentsController < ApplicationController
  include TagsHelper
  before_action :set_incident, only: [:show, :edit, :update, :destroy]

  # Incident should have a public summary when resolved, so not everything is
  # WRC/Delegates-only.

  before_action -> { redirect_to_root_unless_user(:can_manage_incidents?) }, except: [
    :index,
    :show,
  ]

  def index
    @incidents = Incident.includes(:competitions, :incident_tags).all
  end

  def show
  end

  def new
    @incident = Incident.new
  end

  def edit
  end

  def create
    @incident = Incident.new(incident_params)

    if @incident.save
      flash[:success] = "Incident was successfully created."
      redirect_to @incident
    else
      render :new
    end
  end

  def update
    if @incident.update(incident_params)
      flash[:success] = "Incident was successfully updated."
      redirect_to @incident
    else
      render :edit
    end
  end

  def destroy
    @incident.destroy
    if @incident.destroy
      flash[:success] = "Incident was successfully destroyed."
      redirect_to incidents_url
    else
      render :edit
    end
  end

  private

  def set_incident
    @incident = Incident.find(params[:id])
  end

  def incident_params
    params.require(:incident).permit(
      :name,
      :private_description,
      :private_wrc_decision,
      :public_summary,
      :tags,
      :status,
      incident_competitions_attributes: [:id, :competition_id, :comments, :_destroy],
    )
  end
end
