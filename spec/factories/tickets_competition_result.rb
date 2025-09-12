# frozen_string_literal: true

FactoryBot.define do
  factory :tickets_competition_result do
    status { :submitted }
    competition { FactoryBot.create(:competition, :with_delegate, :with_organizer, :registration_open, :with_valid_schedule, :with_guest_limit, :with_meaningless_event_limit, name: "my long competition name above 32 chars 2023") }
    delegate_message { "Please post the results." }

    after(:create) do |ticket_competition_result|
      ticket_competition_result.ticket = FactoryBot.create(:ticket, metadata: ticket_competition_result)
      FactoryBot.create(
        :ticket_stakeholder,
        ticket: ticket_competition_result.ticket,
        stakeholder: UserGroup.teams_committees_group_wrt,
        connection: :assigned,
        stakeholder_role: TicketStakeholder.stakeholder_roles[:actioner],
        is_active: true,
      )
      FactoryBot.create(
        :ticket_stakeholder,
        ticket: ticket_competition_result.ticket,
        stakeholder: ticket_competition_result.competition,
        connection: :cc,
        stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
        is_active: true,
      )
    end

    trait :created_wca_ids do
      status { :created_wca_ids }
    end

    factory :competition_result_ticket, traits: [:created_wca_ids]
  end
end
