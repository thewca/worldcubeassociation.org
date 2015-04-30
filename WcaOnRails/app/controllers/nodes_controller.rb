class NodesController < ApplicationController
  def home
    @nodes = Node.where(promote: true).order(sticky: :desc, created: :desc).paginate(page: params[:page])
  end

  def show
    post_alias = params[:post_alias]
    alias_str = "posts/#{post_alias}"
    @url_alias = UrlAlias.find_by_alias! alias_str
    node_id = @url_alias.source.split("/")[1].to_i
    @node = Node.find(node_id)
  end
end
