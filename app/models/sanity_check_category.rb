# frozen_string_literal: true

class SanityCheckCategory < ApplicationRecord
  include StaticData

  has_many :sanity_checks
end
