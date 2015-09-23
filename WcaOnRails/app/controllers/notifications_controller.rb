class NotificationsController < ApplicationController
  include ApplicationHelper

  before_action :authenticate_user!

  def index
    @notifications = notifications_for_user(current_user)
  end
end
