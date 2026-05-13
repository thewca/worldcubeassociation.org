# frozen_string_literal: true

class Api::V0::UsersController < Api::V0::ApiController
  def show_me
    require_user!
    return unless stale?(current_user)

    # Also include the users current prs so we can handle qualifications on the Frontend
    show_user(current_user, show_rankings: true, private_attributes: ['email'])
  end

  def show_user_by_id
    user = User.find_by(id: params[:id])
    show_user(user)
  end

  def show_users_by_id
    user_ids = params.require(:ids)
    users = User.where(id: user_ids)
    render status: :ok, json: { users: users.as_json({
                                                       only: %w[id wca_id name gender country_iso2],
                                                       methods: ["country"],
                                                       include: [],
                                                     }) }
  end

  def show_user_by_wca_id
    user = User.find_by(wca_id: params[:wca_id])
    show_user(user)
  end

  def permissions
    require_user!
    render json: authenticated_user.permissions if stale?(authenticated_user)
  end

  def personal_records
    require_user!
    return render json: { single: [], average: [] } if current_user.wca_id.blank?

    person = Person.includes(:ranks_single, :ranks_average).find_by!(wca_id: current_user.wca_id)
    render json: { single: person.ranks_single.map(&:to_wcif), average: person.ranks_average.map(&:to_wcif) }
  end

  def preferred_events
    require_user!
    preferred_events = Rails.cache.fetch("#{current_user.id}-preferred-events", expires_in: 24.hours) do
      current_user.preferred_events.pluck(:id)
    end
    render json: preferred_events
  end

  def bookmarked_competitions
    require_user!
    bookmarked_competitions = Rails.cache.fetch("#{current_user.id}-competitions-bookmarked", expires_in: 60.minutes) do
      current_user.competitions_bookmarked.pluck(:competition_id)
    end
    render json: bookmarked_competitions
  end

  private

    def show_user(user, show_rankings: false, private_attributes: [])
      if user
        json = { user: user.serializable_hash(private_attributes: private_attributes) }
        json[:upcoming_competitions] = user.accepted_competitions.select(&:upcoming?) if params[:upcoming_competitions]
        json[:ongoing_competitions] = user.accepted_competitions.select(&:in_progress?) if params[:ongoing_competitions]
        if show_rankings && user.wca_id.present?
          person = Person.includes(:ranks_single, :ranks_average).find_by!(wca_id: user.wca_id)
          json[:rankings] = { single: person.ranks_single, average: person.ranks_average }
        end
        render status: :ok, json: json
      else
        render status: :not_found, json: { user: nil }
      end
    end
end
