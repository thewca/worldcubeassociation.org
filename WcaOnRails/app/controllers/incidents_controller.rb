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
    base_model = Incident.includes(:competitions, :incident_tags)
    if current_user&.can_view_delegate_matters?
      @incidents = base_model.all
    else
      @incidents = base_model.resolved
    end
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

  def mark_as
    @incident = Incident.find(params[:incident_id])
    updated_attrs = {}
    case params[:kind]
    when "sent"
      updated_attrs[:digest_sent_at] = Time.now
    when "resolved"
      updated_attrs[:resolved_at] = Time.now
    else
      flash[:danger] = "Unrecognize action, expecting either 'sent' or 'resolved'."
      return redirect_to @incident
    end

    if @incident.update(updated_attrs)
      flash[:success] = "Successfully updated incident."
    else
      flash[:danger] = "Couldn't mark the incident as sent."
      @incident.errors.each do |key, message|
        flash[:danger] += " #{key} #{message}"
      end
    end
    redirect_to @incident
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
      :title,
      :private_description,
      :private_wrc_decision,
      :public_summary,
      :tags,
      :resolved_at,
      :digest_worthy,
      :digest_sent_at,
      incident_competitions_attributes: [:id, :competition_id, :comments, :_destroy],
    )
  end
end
