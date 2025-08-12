# frozen_string_literal: true

module Types
  class WcifExtensionType < Types::BaseObject
    field :id, String, null: false
    field :specUrl, String, null: false
    field :data, GraphQL::Types::JSON, null: false
  end
end
