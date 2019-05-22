# frozen_string_literal: true

class DelegatesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_view_delegate_crash_course?) }

  def stats
    @delegates = User.delegates.includes(:senior_delegate)
  end
end
