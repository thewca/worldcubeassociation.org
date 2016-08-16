class StatisticsController < ApplicationController
  def index
    @statistics = Statistics.all
  end
end
