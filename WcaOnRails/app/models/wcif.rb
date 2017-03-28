# frozen_string_literal: true

class Wcif
  include ActiveModel::Model

  attr_accessor :competition
  def initialize(competition:)
    self.competition = competition
  end

  # See https://github.com/thewca/worldcubeassociation.org/wiki/wcif
  def json
    {
      "formatVersion" => "1.0",
      "id" => competition.id,
    }
  end
end
