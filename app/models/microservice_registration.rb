# frozen_string_literal: true

class MicroserviceRegistration < ApplicationRecord
  belongs_to :competition
  belongs_to :user
end
