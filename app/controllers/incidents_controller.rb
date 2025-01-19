# frozen_string_literal: true

class IncidentsController < ApplicationController
  include Rails::Pagination
  include TagsHelper

  # Incident should have a public summary when resolved, so not everything is
  # WRC/Delegates-only.
  before_action -> { authenticate_user! && redirect_to_root_unless_user(:can_manage_incidents?) }, except: [
    :index,
    :show,
  ]

  def index
    base_model = Incident.includes(:competitions, :incident_tags)
    @incidents = if current_user&.can_manage_incidents? # WRC members see all
                   base_model.all
                 elsif current_user&.can_view_delegate_matters? # Staff see staff + public
                   base_model.staff_visible
                 else # Public users only see public
                   base_model.publicly_visible
                 end

    respond_to do |format|
      format.html do
        @incidents = @incidents.sort_by(&:last_happened_date).reverse
      end
      format.json do
        @incidents = @incidents.search(params[:q], params: params)
        render json: paginate(
          @incidents.as_json(
            can_view_delegate_matters: current_user&.can_view_delegate_matters?,
          ),
        )
      end
    end
  end

  def show
    set_incident

    # Check visibility and redirect based on user role
    if @incident.visibility == 'draft' && !current_user&.can_manage_incidents?
      redirect_to_root_unless_user(:can_manage_incidents?)
      return
    end

    if @incident.visibility == 'staff' && !current_user&.staff?
      redirect_to_root_unless_user(:staff?)
      nil
    end

    unless @incident.resolved?
      redirect_to_root_unless_user(:can_manage_incidents?)
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
    when "unresolve"
      updated_attrs[:resolved_at] = nil
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
      permitted_params = [
        :title,
        :private_description,
        :private_wrc_decision,
        :public_summary,
        :tags,
        :digest_worthy,
        :visibility,
        { incident_competitions_attributes: [:id, :competition_id, :comments, :_destroy] },
      ]

      params.require(:incident).permit(permitted_params)
    end
end
