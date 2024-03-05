# frozen_string_literal: true

class NotificationsController < ApplicationController
  include NotificationsHelper

  before_action :authenticate_user!

  def index
    @notifications = notifications_for_user(current_user)
  end
end
