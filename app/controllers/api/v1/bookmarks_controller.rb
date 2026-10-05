# frozen_string_literal: true

class Api::V1::BookmarksController < Api::V1::ApiController
  before_action :set_competition

  def show
    render json: { bookmarked: authenticated_user.competition_bookmarked?(@competition) }
  end

  def create
    BookmarkedCompetition.find_or_create_by!(competition: @competition, user: authenticated_user)
    Rails.cache.delete("#{authenticated_user.id}-competitions-bookmarked")
    render json: { bookmarked: true }
  end

  def destroy
    BookmarkedCompetition.where(competition: @competition, user: authenticated_user).destroy_all
    Rails.cache.delete("#{authenticated_user.id}-competitions-bookmarked")
    render json: { bookmarked: false }
  end

  private

    def set_competition
      @competition = Competition.find(params.require(:competition_id))
    end
end
