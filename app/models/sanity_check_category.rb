# frozen_string_literal: true

class SanityCheckCategory < ApplicationRecord
  include StaticData

  has_many :sanity_checks

  def camel_case_name
    name.gsub(/\s+/, '')
  end
end
