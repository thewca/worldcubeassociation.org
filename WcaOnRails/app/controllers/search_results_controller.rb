class SearchResultsController < ApplicationController
  SEARCH_RESULT_LIMIT = 10

  def index
    @omni_query = params[:q]
    if @omni_query.present?
      @competitions = Competition.search(@omni_query).paginate(page: params[:competitions_page], per_page: SEARCH_RESULT_LIMIT)
      @persons = User.search(@omni_query, params: { persons_table: true }).paginate(page: params[:persons_page], per_page: SEARCH_RESULT_LIMIT)
      @posts = Post.search(@omni_query).paginate(page: params[:posts_page], per_page: SEARCH_RESULT_LIMIT)
    end
  end
end
