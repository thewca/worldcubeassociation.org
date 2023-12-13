# frozen_string_literal: true

class Api::V0::UsersController < Api::V0::ApiController
  def show_me
    require_user!
    show_user(current_user)
  end

  def show_user_by_id
    user = User.find_by_id(params[:id])
    show_user(user)
  end

  def show_users_by_id
    user_ids = params.require(:ids)
    users = User.where(id: user_ids)
    render status: :ok, json: { users: users }
  end

  def show_user_by_wca_id
    user = User.find_by_wca_id(params[:wca_id])
    show_user(user)
  end

  def permissions
    require_user!
    if stale?(current_user)
      render json: current_user.permissions
    end
  end

  def personal_records
    require_user!
    return render json: { single: [], average: [] } unless current_user.wca_id.present?
    person = Person.includes(:user, :ranksSingle, :ranksAverage).find_by_wca_id!(current_user.wca_id)
    render json: { single: person.ranksSingle, average: person.ranksAverage }
  end

  def preferred_events
    require_user!
    preferred_events = Rails.cache.fetch("#{current_user.id}-preferred", expires_in: 60.minutes) do
      current_user.preferred_events.pluck(:id)
    end
    render json: preferred_events
  end

  def bookmarked_competitions
    require_user!
    bookmarked_competitions = Rails.cache.fetch("#{current_user.id}-bookmarked", expires_in: 60.minutes) do
      current_user.competitions_bookmarked.pluck(:competition_id)
    end
    render json: bookmarked_competitions
  end

  def token
    if current_user
      render json: { status: "ok" }
    else
      render status: :unauthorized, json: { error: I18n.t('api.login_message') }
    end
  end

  private

    def show_user(user)
      if user
        json = { user: user }
        if params[:upcoming_competitions]
          json[:upcoming_competitions] = user.accepted_competitions.select(&:upcoming?)
        end
        if params[:ongoing_competitions]
          json[:ongoing_competitions] = user.accepted_competitions.select(&:in_progress?)
        end
        render status: :ok, json: json
      else
        render status: :not_found, json: { user: nil }
      end
    end
end
