class WikiPagesController < ApplicationController
  def index
  end

  def new
  end

  def create
  end

  def edit
  end

  def update
  end

  def destroy
  end

  private
    def wiki_page_params
      params.require(:wiki_page).permit(:title, :content)
    end
end
