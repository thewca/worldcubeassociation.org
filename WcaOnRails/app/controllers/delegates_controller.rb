class DelegatesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_admin_results?) }

  def stats
    @delegates = User.all.delegate
    @delegates = @delegates.includes(:delegated_competitions)
  end
end
