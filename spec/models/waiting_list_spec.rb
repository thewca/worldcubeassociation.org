# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WaitingList do
  let(:competition) { FactoryBot.create(:competition, :registration_open, :editable_registrations, :with_organizer) }
  let(:waiting_list) { competition.waiting_list }

  describe 'add to waiting list' do
    it 'first competitor in the waiting list gets set to position 1' do
      registration = FactoryBot.create(:registration, :waiting_list, competition: competition)
      waiting_list.add(registration.id)
      expect(competition.waiting_list.entries[0]).to eq(registration.id)
    end

    it 'second competitor gets set to position 2' do
      waiting_list.add(FactoryBot.create(:registration, :waiting_list, competition: competition).id)
      registration = FactoryBot.create(:registration, :waiting_list, competition: competition)
      waiting_list.add(registration.id)
      expect(competition.waiting_list.entries[1]).to eq(registration.id)
    end
  end

  describe 'with populated waiting list' do
    let(:reg1) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
    let(:reg2) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
    let(:reg3) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
    let(:reg4) { FactoryBot.create(:registration, :waiting_list, competition: competition) }
    let(:reg5) { FactoryBot.create(:registration, :waiting_list, competition: competition) }

    before do
      waiting_list.add(reg1.id)
      waiting_list.add(reg2.id)
      waiting_list.add(reg3.id)
      waiting_list.add(reg4.id)
      waiting_list.add(reg5.id)
    end

    it 'waiting list position gives position, not index' do
      registration = FactoryBot.create(:registration, :waiting_list, competition: competition)
      waiting_list.add(registration.id)
      expect(registration.waiting_list_position).to eq(6)
    end

    it 'can be moved forward in the list' do
      waiting_list.move_to_position(reg3.id, 1)

      expect(reg1.waiting_list_position).to eq(2)
      expect(reg2.waiting_list_position).to eq(3)
      expect(reg3.waiting_list_position).to eq(1)
      expect(reg4.waiting_list_position).to eq(4)
      expect(reg5.waiting_list_position).to eq(5)
    end

    it 'can be moved backward in the list' do
      waiting_list.move_to_position(reg2.id, 4)

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(4)
      expect(reg3.waiting_list_position).to eq(2)
      expect(reg4.waiting_list_position).to eq(3)
      expect(reg5.waiting_list_position).to eq(5)
    end

    it 'can be moved to the last position in the list' do
      waiting_list.move_to_position(reg1.id, 5)

      expect(reg1.waiting_list_position).to eq(5)
      expect(reg2.waiting_list_position).to eq(1)
      expect(reg3.waiting_list_position).to eq(2)
      expect(reg4.waiting_list_position).to eq(3)
      expect(reg5.waiting_list_position).to eq(4)
    end

    it 'can be moved to the last position in the list' do
      waiting_list.move_to_position(reg4.id, 1)

      expect(reg1.waiting_list_position).to eq(2)
      expect(reg2.waiting_list_position).to eq(3)
      expect(reg3.waiting_list_position).to eq(4)
      expect(reg4.waiting_list_position).to eq(1)
      expect(reg5.waiting_list_position).to eq(5)
    end

    it 'nothing happens if you move an item to its current position' do
      waiting_list.move_to_position(reg3.id, 3)

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(2)
      expect(reg3.waiting_list_position).to eq(3)
      expect(reg4.waiting_list_position).to eq(4)
      expect(reg5.waiting_list_position).to eq(5)
    end

    it 'cant be moved to a position greater than the list length' do
      expect { waiting_list.move_to_position(reg3.id, 6) }.to raise_error(ArgumentError, 'Target position out of waiting list range')
    end

    it 'cant be moved to a negative position' do
      expect { waiting_list.move_to_position(reg3.id, -1) }.to raise_error(ArgumentError, 'Target position out of waiting list range')
    end

    it 'cant be moved to position 0' do
      expect { waiting_list.move_to_position(reg3.id, 0) }.to raise_error(ArgumentError, 'Target position out of waiting list range')
    end

    it 'can remove first item' do
      waiting_list.remove(reg1.id)

      expect(reg2.waiting_list_position).to eq(1)
      expect(reg3.waiting_list_position).to eq(2)
      expect(reg4.waiting_list_position).to eq(3)
      expect(reg5.waiting_list_position).to eq(4)
      expect(waiting_list.entries.count).to eq(4)
    end

    it 'can remove last item' do
      waiting_list.remove(reg5.id)

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(2)
      expect(reg3.waiting_list_position).to eq(3)
      expect(reg4.waiting_list_position).to eq(4)
      expect(waiting_list.entries.count).to eq(4)
    end

    it 'can remove middle item' do
      waiting_list.remove(reg3.id)

      expect(reg1.waiting_list_position).to eq(1)
      expect(reg2.waiting_list_position).to eq(2)
      expect(reg4.waiting_list_position).to eq(3)
      expect(reg5.waiting_list_position).to eq(4)
      expect(waiting_list.entries.count).to eq(4)
    end
  end
end
