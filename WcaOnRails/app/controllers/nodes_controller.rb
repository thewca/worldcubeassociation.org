class NodesController < ApplicationController
  def index
    @nodes = Node.where(promote: true).order(sticky: :desc, created: :desc).paginate(page: params[:page])
  end

  def rss
    @nodes = Node.where(promote: true).order(created: :desc).paginate(page: params[:page])
    respond_to :xml
  end

  def show
    post_alias = params[:post_alias]
    @url_alias = UrlAlias.find_by_alias! [post_alias, "posts/#{post_alias}"]
    node_id = @url_alias.source.split("/")[1].to_i
    @node = Node.find(node_id)
  end
end
