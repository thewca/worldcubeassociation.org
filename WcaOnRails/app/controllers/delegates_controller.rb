# frozen_string_literal: true
class DelegatesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }

  def stats
    @delegates = User.delegates
  end
end
