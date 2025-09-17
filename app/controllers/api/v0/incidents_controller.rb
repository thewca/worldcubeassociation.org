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
end
