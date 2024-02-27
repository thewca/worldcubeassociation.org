# frozen_string_literal: true

# NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!

class ForumsController < ApplicationController
  def index
    @forums = Forum.all
  end

  def show
    @forum = Forum.includes(:forum_topics).find(params[:id])
  end
end
