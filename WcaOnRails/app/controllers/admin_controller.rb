class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action :can_admin_results_only

  def index
    @pending_avatars_count = User.where.not(pending_avatar: nil).count
    @pending_media_count = CompetitionsMedia.where(status: 'pending').count
  end
end
