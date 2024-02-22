# frozen_string_literal: true

class Api::V0::UsersController < Api::V0::ApiController
  def show_me
    require_user!
    if stale?(current_user)
      # Also include the users current prs so we can handle qualifications on the Frontend
      show_user(current_user, show_rankings: true)
    end
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

  def my_competitions
    if current_user
      options = {
        only: %w[id name website start_date end_date],
        methods: %w[url city country_iso2 registration_not_yet_opened? registration_full? registration_past? results_posted? visible? confirmed? cancelled? report_posted?],
        include: %w[],
      }
      ActiveRecord::Base.connected_to(role: :read_replica) do
        competition_ids = current_user.organized_competitions.pluck(:competition_id)
        competition_ids.concat(current_user.delegated_competitions.pluck(:competition_id))
        registrations = current_user.registrations.includes(:competition).accepted.reject { |r| r.competition.results_posted? }
        registrations.concat(current_user.registrations.includes(:competition).pending.select { |r| r.competition.upcoming? })
        registered_for_by_competition_id = registrations.uniq.to_h do |r|
          [r.competition.id, r.as_json({ only: [], methods: ["wcif_status"] })]
        end
        competition_ids.concat(registered_for_by_competition_id.keys)
        if current_user.person
          competition_ids.concat(current_user.person.competitions.pluck(:competitionId))
        end
        # An organiser might still have duties to perform for a cancelled competition until the date of the competition has passed.
        # For example, mailing all competitors about the cancellation.
        # In general ensuring ease of access until it is certain that they won't need to frequently visit the page anymore.
        competitions = Competition.includes(:delegate_report, :delegates)
                                  .where(id: competition_ids.uniq).where("cancelled_at is null or end_date >= curdate()")
                                  .sort_by { |comp| comp.start_date || (Date.today + 20.year) }.reverse
        past_competitions, not_past_competitions = competitions.partition(&:is_probably_over?)
        bookmarked_ids = current_user.competitions_bookmarked.pluck(:competition_id)
        bookmarked_competitions = Competition.not_over
                                             .where(id: bookmarked_ids.uniq)
                                             .sort_by(&:start_date)
        render json: { past_competitions: past_competitions.as_json(options),
                       future_competitions: not_past_competitions.as_json(options),
                       registered_for_by_competition_id: registered_for_by_competition_id,
                       bookmarked_competitions: bookmarked_competitions.as_json(options) }
      end
    else
      render status: :unauthorized, json: { error: I18n.t('api.login_message') }
    end
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
    person = Person.includes(:ranksSingle, :ranksAverage).find_by_wca_id!(current_user.wca_id)
    render json: { single: person.ranksSingle, average: person.ranksAverage }
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

  def token
    require_user!
    render json: { status: "ok" }
  end

  private

    def show_user(user, show_rankings: false)
      if user
        json = { user: user }
        if params[:upcoming_competitions]
          json[:upcoming_competitions] = user.accepted_competitions.select(&:upcoming?)
        end
        if params[:ongoing_competitions]
          json[:ongoing_competitions] = user.accepted_competitions.select(&:in_progress?)
        end
        if show_rankings && user.wca_id.present?
          person = Person.includes(:ranksSingle, :ranksAverage).find_by_wca_id!(user.wca_id)
          json[:rankings] = { single: person.ranksSingle, average: person.ranksAverage }
        end
        render status: :ok, json: json
      else
        render status: :not_found, json: { user: nil }
      end
    end
end
