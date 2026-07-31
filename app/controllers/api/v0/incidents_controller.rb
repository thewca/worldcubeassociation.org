# frozen_string_literal: true

class Api::V0::IncidentsController < Api::V0::ApiController
  def index
    base_model = Incident.includes(:competitions, :incident_tags)
    incidents = if current_user&.can_manage_incidents?
                  base_model.all
                else
                  base_model.resolved
                end

    incidents = incidents.search(params[:q], params: params)
    render json: paginate(
      incidents.as_json(
        can_view_delegate_matters: current_user&.can_view_delegate_matters?,
      ),
    )
  end

  def show
    incident = Incident.includes(:competitions, :incident_tags).find(params.require(:id))
    # Unresolved incidents are not publicly visible, mirroring the scoping in `index`.
    return render status: :not_found, json: { error: "Incident not found" } unless incident.resolved? || current_user&.can_manage_incidents?

    render json: incident.as_json(
      can_view_delegate_matters: current_user&.can_view_delegate_matters?,
    )
  end
end
