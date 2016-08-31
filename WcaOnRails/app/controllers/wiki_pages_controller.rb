class WikiPagesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_view_wiki?) }
  before_action -> { redirect_unless_user(:can_manage_wiki?) }, only: %i(
    new create edit update destroy
  )

  def index
    @wiki_pages = WikiPage.all
  end

  def new
    @wiki_page = current_user.wiki_pages.build
  end

  def create
    @wiki_page = current_user.wiki_pages.build(wiki_page_params)

    if @wiki_page.save
      flash[:success] = "Wiki page successfully created."
      redirect_to wiki_page_url(@wiki_page)
    else
      render :new
    end
  end

  def show
    @wiki_page = wiki_from_params
  end

  def edit
    @wiki_page = wiki_from_params
  end

  def update
    @wiki_page = wiki_from_params

    if @wiki_page.update(wiki_page_params)
      flash[:success] = "Wiki page successfully updated."
      redirect_to wiki_page_url(@wiki_page)
    else
      render :edit
    end
  end

  def destroy
    WikiPage.find(params[:id]).destroy
    flash[:success] = "Wiki page successfully deleted."
    redirect_to wiki_pages_url
  end

  private def wiki_page_params
    params.require(:wiki_page).permit(:title, :content)
  end

  private def wiki_from_params
    WikiPage.find(params[:id])
  end
end
