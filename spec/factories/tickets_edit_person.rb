# frozen_string_literal: true

FactoryBot.define do
  factory :tickets_edit_person do
    status { :open }
    wca_id { FactoryBot.create(:user_with_wca_id).wca_id }

    trait :edit_name do
      after(:create) do |edit_name_ticket|
        edit_name_ticket.ticket = FactoryBot.create(:ticket, metadata: edit_name_ticket)
        FactoryBot.create(
          :tickets_edit_name_field,
          tickets_edit_person_id: edit_name_ticket.id,
        )
        FactoryBot.create(
          :ticket_stakeholder,
          ticket: edit_name_ticket.ticket,
          stakeholder: UserGroup.teams_committees_group_wrt,
          connection: :assigned,
          stakeholder_role: TicketStakeholder.stakeholder_roles[:actioner],
          is_active: true,
        )
        FactoryBot.create(
          :ticket_stakeholder,
          ticket: edit_name_ticket.ticket,
          stakeholder: FactoryBot.create(:user),
          connection: :cc,
          stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
          is_active: true,
        )
      end
    end

    factory :edit_name_ticket, traits: [:edit_name]
  end
end
