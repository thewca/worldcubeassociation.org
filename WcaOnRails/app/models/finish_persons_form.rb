# frozen_string_literal: true

class FinishPersonsForm
  include ActiveModel::Model

  attr_accessor :competition_id

  def search_persons
    FinishUnfinishedPersons.search_persons competition_id
  end
end
