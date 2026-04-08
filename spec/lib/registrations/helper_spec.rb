# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Registrations::Helper do
  describe '.user_for_registration!' do
    let!(:competition) { create(:competition, :registration_open, event_ids: %w[333 444]) }
    let!(:creator) { create(:user) }

    context 'with a brand new person without a WCA ID' do
      let(:registration_data) do
        {
          name: 'Test Person',
          wcaId: nil,
          countryIso2: 'US',
          gender: 'm',
          birthdate: '2000-01-01',
          email: 'testperson@example.com',
          comments: 'First time competing!',
          registration: {
            eventIds: %w[333],
          },
        }
      end

      it 'creates a new locked user account' do
        user, locked_account_created = Registrations::Helper.user_for_registration!(registration_data)

        expect(locked_account_created).to be(true)
        expect(user.name).to eq('Test Person')
        expect(user.email).to eq('testperson@example.com')
        expect(user.access_locked?).to be(true) if user.respond_to?(:access_locked?)
      end
    end

    context 'with an existing user' do
      let!(:existing_user) { create(:user) }
      let(:registration_data) do
        {
          name: existing_user.name,
          wcaId: existing_user.wca_id,
          countryIso2: Country.c_find_by_iso2(existing_user.country_iso2)&.iso2,
          gender: existing_user.gender,
          birthdate: existing_user.dob,
          email: existing_user.email,
          registration: {
            eventIds: %w[333],
          },
        }
      end

      it 'uses the existing user' do
        expect do
          user, locked_account_created = Registrations::Helper.user_for_registration!(registration_data)

          expect(locked_account_created).to be(false)
          expect(user.id).to eq(existing_user.id)
        end.to change(User, :count).by(0)
      end
    end

    context 'when registration already exists for the user' do
      let(:existing_user) { create(:user) }
      let!(:existing_registration) do
        create(:registration, competition: competition, user: existing_user, event_ids: %w[333])
      end

      let(:registration_data) do
        {
          name: existing_user.name,
          wcaId: existing_user.wca_id,
          countryIso2: Country.c_find_by_iso2(existing_user.country_iso2)&.iso2,
          gender: existing_user.gender,
          birthdate: existing_user.dob,
          email: existing_user.email,
          registration: {
            eventIds: %w[333 444],
          },
        }
      end

      it 'returns the user normallly since this method does not check for registrations' do
        user, locked_account_created = Registrations::Helper.user_for_registration!(registration_data)

        expect(locked_account_created).to be(false)
        expect(user.id).to eq(existing_user.id)
      end
    end
  end
end
