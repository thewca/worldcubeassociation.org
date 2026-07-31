# frozen_string_literal: true

class Api::V0::IncidentsController < Api::V0::ApiController
  before_action :require_incident_management, only: %i[mark_as destroy]

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

  def mark_as
    incident = Incident.find(params.require(:incident_id))

    resolved_at = case params.require(:kind)
                  when "resolved"
                    Time.now
                  when "unresolve"
                    nil
                  else
                    return render status: :bad_request, json: { error: "Unrecognized action: '#{params[:kind]}'" }
                  end

    return render status: :unprocessable_content, json: { error: incident.errors.full_messages } unless incident.update(resolved_at: resolved_at)

    render json: incident.as_json(can_view_delegate_matters: true)
  end

  def destroy
    incident = Incident.find(params.require(:id))
    incident.destroy!

    render json: { status: "ok" }
  end

  private def require_incident_management
    return render status: :unauthorized, json: { error: "Please log in" } unless current_user

    render status: :forbidden, json: { error: "Cannot manage incidents" } unless current_user.can_manage_incidents?
  end
end
