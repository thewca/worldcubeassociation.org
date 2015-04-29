class FeedController < ApplicationController
  def home
    @nodes = Node.where(promote: true).order(sticky: :desc, created: :desc).paginate(page: params[:page])
  end
end
