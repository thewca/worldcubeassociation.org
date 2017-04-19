# frozen_string_literal: true

class SearchResultsController < ApplicationController
  SEARCH_RESULT_LIMIT = 10

  def index
    @omni_query = params[:q]
    if @omni_query.present?
      @competitions = Competition.search(@omni_query).page(params[:competitions_page]).per(SEARCH_RESULT_LIMIT)
      @persons = User.search(@omni_query, params: { persons_table: true }).page(params[:people_page]).per(SEARCH_RESULT_LIMIT)
      @posts = Post.search(@omni_query).page(params[:posts_page]).per(SEARCH_RESULT_LIMIT)
      @regulations = Kaminari.paginate_array(Regulation.search(@omni_query)).page(params[:regulations_page]).per(SEARCH_RESULT_LIMIT)
    end
  end
end
