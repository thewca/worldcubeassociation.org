# frozen_string_literal: true

class Api::V0::PersonsController < Api::V0::ApiController
  def me
    if current_user
      if stale?(current_user)
        # Also include the users current prs so we can handle qualifications on the Frontend
        if current_user.wca_id.present?
          person = Person.includes(:user, :ranksSingle, :ranksAverage).find_by_wca_id!(current_user.wca_id)
          render json: { user: current_user, rankings: { single: person.ranksSingle, average: person.ranksAverage } }
        else
          render json: { user: current_user }
        end
      end
    else
      render status: :unauthorized, json: { error: "Please log in" }
    end
  end

  def permissions
    if current_user
      if stale?(current_user)
        render json: current_user.permissions
      end
    else
      render status: :unauthorized, json: { error: "Please log in" }
    end
  end
end
