# frozen_string_literal: true

FactoryBot.define do
  factory :groups_metadata_board do
    factory :board_user_group_metadata do
      email { "board@worldcubeassociation.org" }
    end
  end
end
