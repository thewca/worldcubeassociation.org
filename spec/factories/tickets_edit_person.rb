# frozen_string_literal: true

FactoryBot.define do
  factory :tickets_edit_person do
    status { :open }
    wca_id { FactoryBot.create(:user_with_wca_id).wca_id }

    trait :edit_name do
      previous_name { Faker::Name }
      new_name { Faker::Name }
      after(:create) do |edit_name_ticket|
        edit_name_ticket.ticket = FactoryBot.create(:ticket, :edit_person, name: "Edit Name", metadata: edit_name_ticket)
        FactoryBot.create(
          :ticket_stakeholder,
          ticket: edit_name_ticket.ticket,
          stakeholder_id: UserGroup.teams_committees_group_wrt.id,
          stakeholder_type: :user_group,
          connection: :assigned,
          is_active: true,
        )
      end
    end

    factory :edit_name_ticket, traits: [:edit_name]
  end
end
