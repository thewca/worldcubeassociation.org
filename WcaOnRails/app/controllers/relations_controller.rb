# frozen_string_literal: true
class RelationsController < ApplicationController
  def index
    render :relation
  end

  def relation
    @wca_id1 = params[:wca_id1]
    @wca_id2 = params[:wca_id2]
    @selected_people = Person.current.where(wca_id: [@wca_id1, @wca_id2]).includes(:user)
    if @selected_people.count != 2
      flash[:danger] = I18n.t('relations.messages.invalid_wca_ids')
      redirect_to relations_url and return
    end
    wca_ids_chain = Relations.get_chain(@wca_id1, @wca_id2)
    @people_chain = Person.current.where(wca_id: wca_ids_chain).includes(:user).sort_by { |person| wca_ids_chain.find_index person.wca_id }
    render :relation
  end
end
