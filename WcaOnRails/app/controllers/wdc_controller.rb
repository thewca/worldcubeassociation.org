# frozen_string_literal: true

class WdcController < ApplicationController
  def root
    @posts = Post.joins(:post_tags).where('post_tags.tag = ?', "wdc")
    @posts = @posts.order(sticky: :desc, created_at: :desc).includes(:author).page(params[:page])
  end
end
