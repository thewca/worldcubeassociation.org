# frozen_string_literal: true

# NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!

class ForumTopicsController < ApplicationController
  def show
    @topic = ForumTopic.includes(forum_posts: [:poster]).find(params[:id])
  end
end
