module Admin
  class CompsController < AdminController
    def admin_index
      # Default params
      params[:region] ||= "all"
      params[:state] ||= "present"
      params[:year] ||= "all years"
      params[:display] ||= "list"

      @past_selected = params[:state] == "past"
      @present_selected = !@past_selected

      @years = ["all years"] + Competition.where(showAtAll: true).pluck(:year).uniq.select { |y| y <= Date.today.year }.sort!.reverse!
      @competitions = Competition.where(showAtAll: true).order(:year, :month, :day)

      @competitions = @competitions.includes(:delegates)

      if @present_selected
        @competitions = @competitions.where("CAST(CONCAT(year,'-',endMonth,'-',endDay) as Datetime) >= ?", Date.today)
      else
        @competitions = @competitions.where("CAST(CONCAT(year,'-',endMonth,'-',endDay) as Datetime) < ?", Date.today).reverse_order
        unless params[:year] == "all years"
          @competitions = @competitions.where(year: params[:year])
        end
      end

      unless params[:region] == "all"
        @competitions = @competitions.select { |competition| competition.belongs_to_region?(params[:region]) }
      end

      if params[:search].present?
        @competitions = @competitions.select { |competition| competition.contains?(params[:search]) }
      end

      respond_to do |format|
        format.html {}
        format.js do
          # We change the browser's history when replacing url after an Ajax request.
          # So we must prevent a browser from caching the JavaScript response.
          # It's necessary because if the browser caches the response, the user will see a JavaScript response
          # when he clicks browser back/forward buttons.
          response.headers["Cache-Control"] = "no-cache, no-store"
          render 'admin_index', locals: { current_url: request.original_url }
        end
      end
    end
  end
end
