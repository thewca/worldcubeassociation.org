# frozen_string_literal: true

module Types
  class PersonalBestType < Types::BaseObject
    field :eventId, String, null: false
    field :best, Integer, null: false
    field :worldRanking, Integer, null: false
    field :continentalRanking, Integer, null: false
    field :nationalRanking, Integer, null: false
    field :type, String, null: false
  end
end
