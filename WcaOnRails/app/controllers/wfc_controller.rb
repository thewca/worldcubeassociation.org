# frozen_string_literal: true

class WfcController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_admin_finances?) }

  def panel
  end
end
