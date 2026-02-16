# frozen_string_literal: true

class SearchResultsController < ApplicationController
  SEARCH_QUERY_LIMIT = 50
  SEARCH_RESULT_LIMIT = 10
  MAX_PAGES = 3
  MAX_RESULTS = SEARCH_RESULT_LIMIT * MAX_PAGES

  def index
    @omni_query = params[:q]&.slice(0...SEARCH_QUERY_LIMIT)

    # strict sanitization to prevent injecting any HTML tags at all
    @omni_query = sanitize(@omni_query, tags: [], attributes: [])

    return if @omni_query.blank?

    @competitions = limit_pagination(Competition.search(@omni_query), params[:competitions_page])
    @persons = limit_pagination(Person.search(@omni_query), params[:people_page])
    @posts = limit_pagination(Post.search(@omni_query), params[:posts_page])
    @regulations = limit_pagination(Kaminari.paginate_array(Regulation.search(@omni_query)), params[:regulations_page])
    @incidents = limit_pagination(Incident.search(@omni_query), params[:incidents_page])
  end

  private def limit_pagination(scope, page_param)
    page = [page_param.to_i, MAX_PAGES].min
    paginated = scope.page(page).per(SEARCH_RESULT_LIMIT)

    # Override total_count to limit visible pages
    def paginated.total_count
      [super, MAX_RESULTS].min
    end

    paginated
  end
end
