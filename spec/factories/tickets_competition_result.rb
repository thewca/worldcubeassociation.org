# frozen_string_literal: true

FactoryBot.define do
  factory :tickets_competition_result do
    trait :newly_created do
      after(:create) do |competition_result_ticket|
        competition_result_ticket.ticket = create(:ticket, metadata: competition_result_ticket)
        create(
          :ticket_stakeholder,
          ticket: competition_result_ticket.ticket,
          stakeholder: competition_result_ticket.competition,
          connection: :assigned,
          stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
          is_active: true,
        )
      end
    end

    factory :competition_result_ticket, traits: [:newly_created]
  end
end
