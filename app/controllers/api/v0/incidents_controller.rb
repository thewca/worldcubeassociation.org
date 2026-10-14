# frozen_string_literal: true

class Api::V0::IncidentsController < Api::V0::ApiController
  before_action :require_incident_management, only: %i[mark_as destroy]

  def index
    base_model = Incident.includes(:competitions, :incident_tags)
    incidents = if authenticated_user&.can_manage_incidents?
                  base_model.all
                else
                  base_model.resolved
                end

    incidents = incidents.search(params[:q], params: params)
    render json: paginate(
      incidents.as_json(
        can_view_delegate_matters: authenticated_user&.can_view_delegate_matters?,
      ),
    )
  end

  def show
    # Unresolved incidents are not publicly visible, mirroring the scoping in `index`. Scoping the
    # lookup rather than checking after the fact lets `find` raise, so a hidden incident and a
    # missing one produce the same 404 through the shared `ActiveRecord::RecordNotFound` handler.
    base_model = authenticated_user&.can_manage_incidents? ? Incident.all : Incident.resolved
    # `serializable_hash` walks the tags and the competition of each `incident_competition`.
    incident = base_model.includes(:incident_tags, incident_competitions: :competition)
                         .find(params.require(:id))

    render json: incident.as_json(
      can_view_delegate_matters: authenticated_user&.can_view_delegate_matters?,
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

    render json: incident.as_json(
      can_view_delegate_matters: authenticated_user.can_view_delegate_matters?,
    )
  end

  def destroy
    incident = Incident.find(params.require(:id))
    incident.destroy!

    render json: { status: "ok" }
  end

  private def require_incident_management
    return render status: :unauthorized, json: { error: "Please log in" } unless authenticated_user

    render status: :forbidden, json: { error: "Cannot manage incidents" } unless authenticated_user.can_manage_incidents?
  end
end
