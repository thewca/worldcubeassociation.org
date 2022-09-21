# frozen_string_literal: true

class IncidentsController < ApplicationController
  include TagsHelper

  # Incident should have a public summary when resolved, so not everything is
  # WRC/Delegates-only.
  before_action -> { authenticate_user! && redirect_to_root_unless_user(:can_manage_incidents?) }, except: [
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
    respond_to do |format|
      format.html {}
      format.json do
        @incidents = Incident.all
        # // todo: filter/search?
        total_entries = @incidents.length
        @incidents = @incidents
                     .page(params[:page] || 1)
                     .per(params[:entries_per_page] || 10)
        render json: {
          totalEntries: total_entries,
          totalPages: @incidents.total_pages,
          incidents: @incidents.as_json(
            can_view_delegate_matters: current_user&.can_view_delegate_matters?,
          ),
        }
      end
    end
  end

  def show
    set_incident
    unless @incident.resolved?
      redirect_to_root_unless_user(:can_view_delegate_matters?)
    end
  end

  def new
    @incident = Incident.new
  end

  def edit
    set_incident
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
      flash[:danger] = "Unrecognized action: '#{params[:kind]}'"
      return redirect_to @incident
    end

    if @incident.update(updated_attrs)
      flash[:success] = "Successfully updated incident."
    else
      flash[:danger] = "Couldn't mark the incident as sent."
      @incident.errors.each do |error|
        flash[:danger] += " #{error.attribute} #{error.message}"
      end
    end
    redirect_to @incident
  end

  def update
    set_incident
    if @incident.update(incident_params)
      flash[:success] = "Incident was successfully updated."
      redirect_to @incident
    else
      render :edit
    end
  end

  def destroy
    set_incident
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
      :digest_worthy,
      incident_competitions_attributes: [:id, :competition_id, :comments, :_destroy],
    )
  end
end
