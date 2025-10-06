# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WaitingList do
  let(:competition) { create(:competition, :registration_open, :editable_registrations, :with_organizer) }
  let(:waiting_list) { competition.waiting_list }

  it 'position is nil when registration not on waiting list' do
    registration = create(:registration)
    expect(registration.waiting_list_position).to be_nil
  end

  describe 'add to waiting list' do
    it 'first competitor in the waiting list gets set to position 1' do
      registration = create(:registration, :pending, competition: competition)
      registration.update!(competing_status: 'waiting_list')
      waiting_list.add(registration)
      expect(competition.waiting_list.entries[0]).to eq(registration.id)
    end

    it 'second competitor gets set to position 2' do
      create(:registration, :waiting_list, competition: competition).id
      registration = create(:registration, :waiting_list, competition: competition)
      expect(competition.waiting_list.entries[1]).to eq(registration.id)
    end

    it 're-adding a registration has no effect' do
      registrations = create_list(:registration, 3, :waiting_list, competition: competition)
      initial_waiting_list = waiting_list.entries
      waiting_list.add(registrations.first)
      expect(competition.waiting_list.reload.entries).to eq(initial_waiting_list)
    end

    it 'doesnt get added if the registration is already on the list' do
      registration = create(:registration, :waiting_list, competition: competition)
      waiting_list.add(registration)
      expect(waiting_list.entries.count).to eq(1)
    end

    it 'must have waiting_list status to be added' do
      registration = create(:registration, :pending, competition: competition)
      expect do
        waiting_list.add(registration)
      end.to raise_error(ArgumentError, "Registration must have a competing_status of 'waiting_list' to be added to the waiting list")
    end
  end

  describe 'with populated waiting list' do
    let!(:reg1) { create(:registration, :waiting_list, competition: competition) }
    let!(:reg2) { create(:registration, :waiting_list, competition: competition) }
    let!(:reg3) { create(:registration, :waiting_list, competition: competition) }
    let!(:reg4) { create(:registration, :waiting_list, competition: competition) }
    let!(:reg5) { create(:registration, :waiting_list, competition: competition) }

    it 'waiting list position gives position, not index' do
      registration = create(:registration, :waiting_list, competition: competition)
      expect(registration.waiting_list_position).to eq(6)
    end

    it 'can be moved forward in the list' do
      waiting_list.move_to_position(reg3, 1)

      expect(reg1.waiting_list_position).to eq(2)
      expect(reg2.waiting_list_position).to eq(3)
      expect(reg3.waiting_list_position).to eq(1)
      expect(reg4.waiting_list_position).to eq(4)
      expect(reg5.waiting_list_position).to eq(5)
    end

    it 'can be moved backward in the list' do
      waiting_list.move_to_position(reg2, 4)

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(4)
      expect(reg3.waiting_list_position).to eq(2)
      expect(reg4.waiting_list_position).to eq(3)
      expect(reg5.waiting_list_position).to eq(5)
    end

    it 'can be moved to the last position in the list' do
      waiting_list.move_to_position(reg1, 5)

      expect(reg1.waiting_list_position).to eq(5)
      expect(reg2.waiting_list_position).to eq(1)
      expect(reg3.waiting_list_position).to eq(2)
      expect(reg4.waiting_list_position).to eq(3)
      expect(reg5.waiting_list_position).to eq(4)
    end

    it 'can be moved to the last position in the list' do
      waiting_list.move_to_position(reg4, 1)

      expect(reg1.waiting_list_position).to eq(2)
      expect(reg2.waiting_list_position).to eq(3)
      expect(reg3.waiting_list_position).to eq(4)
      expect(reg4.waiting_list_position).to eq(1)
      expect(reg5.waiting_list_position).to eq(5)
    end

    it 'nothing happens if you move an item to its current position' do
      waiting_list.move_to_position(reg3, 3)

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(2)
      expect(reg3.waiting_list_position).to eq(3)
      expect(reg4.waiting_list_position).to eq(4)
      expect(reg5.waiting_list_position).to eq(5)
    end

    it 'cant be moved to a position greater than the list length' do
      expect { waiting_list.move_to_position(reg3, 6) }.to raise_error(ArgumentError, 'Target position out of waiting list range')
    end

    it 'cant be moved to a negative position' do
      expect { waiting_list.move_to_position(reg3, -1) }.to raise_error(ArgumentError, 'Target position out of waiting list range')
    end

    it 'cant be moved to position 0' do
      expect { waiting_list.move_to_position(reg3, 0) }.to raise_error(ArgumentError, 'Target position out of waiting list range')
    end

    it 'can remove first item' do
      waiting_list.remove(reg1)

      expect(reg2.waiting_list_position).to eq(1)
      expect(reg3.waiting_list_position).to eq(2)
      expect(reg4.waiting_list_position).to eq(3)
      expect(reg5.waiting_list_position).to eq(4)
      expect(waiting_list.entries.count).to eq(4)
    end

    it 'can remove last item' do
      waiting_list.remove(reg5)

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(2)
      expect(reg3.waiting_list_position).to eq(3)
      expect(reg4.waiting_list_position).to eq(4)
      expect(waiting_list.entries.count).to eq(4)
    end

    it 'can remove middle item' do
      waiting_list.remove(reg3)

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(2)
      expect(reg4.waiting_list_position).to eq(3)
      expect(reg5.waiting_list_position).to eq(4)
      expect(waiting_list.entries.count).to eq(4)
    end

    it 'does nothing if removing an item which isnt present' do
      reg = create(:registration, id: 999_999, competition: competition)
      expect { waiting_list.remove(reg) }.not_to raise_error

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(2)
      expect(reg3.waiting_list_position).to eq(3)
      expect(reg4.waiting_list_position).to eq(4)
      expect(reg5.waiting_list_position).to eq(5)
      expect(waiting_list.entries.count).to eq(5)
    end
  end
end
