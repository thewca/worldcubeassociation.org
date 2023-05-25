# frozen_string_literal: true

class FinishPersonsForm
  include ActiveModel::Model

  attr_accessor :competition_ids

  def competitions
    competition_ids.split(',').uniq.compact
  end

  def search_persons
    FinishUnfinishedPersons.search_persons competitions
  end
end
