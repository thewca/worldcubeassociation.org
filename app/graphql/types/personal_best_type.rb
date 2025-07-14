# frozen_string_literal: true

module Types
  class PersonalBestType < Types::BaseObject
    field :event_id, String, null: false
    field :best, Integer, null: false
    field :world_ranking, Integer, null: false
    field :continental_ranking, Integer, null: false
    field :national_ranking, Integer, null: false
    field :type, String, null: false
  end
end
