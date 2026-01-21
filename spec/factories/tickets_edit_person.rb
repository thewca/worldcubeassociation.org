# frozen_string_literal: true

FactoryBot.define do
  factory :tickets_edit_person do
    status { :open }
    wca_id { FactoryBot.create(:user_with_wca_id).wca_id }

    trait :default_stakeholders do
      after(:create) do |edit_person_ticket|
        edit_person_ticket.ticket = FactoryBot.create(:ticket, metadata: edit_person_ticket)
        FactoryBot.create(
          :ticket_stakeholder,
          ticket: edit_person_ticket.ticket,
          stakeholder: UserGroup.teams_committees_group_wrt,
          connection: :assigned,
          stakeholder_role: TicketStakeholder.stakeholder_roles[:actioner],
          is_active: true,
        )
        FactoryBot.create(
          :ticket_stakeholder,
          ticket: edit_person_ticket.ticket,
          stakeholder: FactoryBot.create(:user),
          connection: :cc,
          stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
          is_active: true,
        )
      end
    end

    trait :edit_name do
      after(:create) do |edit_name_ticket|
        FactoryBot.create(
          :tickets_edit_name_field,
          tickets_edit_person_id: edit_name_ticket.id,
          old_value: edit_name_ticket.person.name,
        )
      end
    end

    trait :edit_dob do
      after(:create) do |edit_dob_ticket|
        FactoryBot.create(
          :tickets_edit_dob_field,
          tickets_edit_person_id: edit_dob_ticket.id,
          old_value: edit_dob_ticket.person.dob,
        )
      end
    end

    trait :edit_country do
      after(:create) do |edit_country_ticket|
        FactoryBot.create(
          :tickets_edit_country_field,
          tickets_edit_person_id: edit_country_ticket.id,
          old_value: edit_country_ticket.person.country_iso2,
        )
      end
    end

    trait :edit_gender do
      after(:create) do |edit_gender_ticket|
        FactoryBot.create(
          :tickets_edit_gender_field,
          tickets_edit_person_id: edit_gender_ticket.id,
          old_value: edit_gender_ticket.person.gender,
        )
      end
    end

    factory :edit_name_ticket, traits: %i[edit_name default_stakeholders]
    factory :edit_dob_ticket, traits: %i[edit_dob default_stakeholders]
    factory :edit_country_ticket, traits: %i[edit_country default_stakeholders]
    factory :edit_gender_ticket, traits: %i[edit_gender default_stakeholders]
  end
end
