# frozen_string_literal: true

class MicroserviceRegistration < ApplicationRecord
  belongs_to :competition
  belongs_to :user

  delegate :name, :email, to: :user

  attr_accessor :status

  def load_ms_model(ms_model)
    self.status = ms_model.status
  end

  def accepted?
    status == "accepted"
  end

  def deleted?
    status == "deleted"
  end
end
