# frozen_string_literal: true
class RelationsController < ApplicationController
  def index
  end

  def create
    @wca_id_1, @wca_id_2 = [params[:wca_id_1], params[:wca_id_2]]
    @selected_people = Person.where(wca_id: [@wca_id_1, @wca_id_2]).includes(:user)
    if @selected_people.count != 2
      flash[:danger] = "Please provide two different valid WCA IDs." # TODO: I18n
      render :index
      return
    end
    wca_ids_chain = Relations.get_chain(@wca_id_1, @wca_id_2)
    @people = Person.where(wca_id: wca_ids_chain).includes(:user).sort_by { |person| wca_ids_chain.find_index person.wca_id }
  end
end
