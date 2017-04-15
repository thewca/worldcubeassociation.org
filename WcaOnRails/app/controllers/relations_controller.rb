# frozen_string_literal: true
class RelationsController < ApplicationController
  def index
  end

  def create
    @wca_id_1, @wca_id_2 = [params[:wca_id_1], params[:wca_id_2]]
    @selected_people = Person.includes(:user).where(wca_id: [@wca_id_1, @wca_id_2])
    if @selected_people.count != 2
      flash[:danger] = "Please provide two different valid WCA IDs." # TODO: I18n
      render :index
      return
    end
    @people = Relations.get_chain(@wca_id_1, @wca_id_2)
  end
end
