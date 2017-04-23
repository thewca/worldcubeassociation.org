# frozen_string_literal: true

class Linking < ApplicationRecord
  self.primary_key = "wca_id"

  def wca_ids
    super.split(',')
  end

  def wca_ids=(list)
    super(list.join(','))
  end
end
