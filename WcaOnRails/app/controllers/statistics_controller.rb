class StatisticsController < ApplicationController
  layout "php_land"

  def index
    @statistics = Statistics::all
  end
end
