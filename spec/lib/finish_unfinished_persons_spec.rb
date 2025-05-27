# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FinishUnfinishedPersons do
  describe '.compute_semi_id' do
    let(:competition_year) { 2023 }
    let(:available_per_semi) { {} }

    context 'when a unique semi-ID can be generated' do
      let(:person_name) { 'John Doe' }

      it 'returns the correct semi-ID and updates available_per_semi' do
        create(:person, :no_wca_id)
        semi_id, updated_available = described_class.compute_semi_id(competition_year, person_name, available_per_semi)

        expect(semi_id).to start_with('2023')
        expect(updated_available).to have_key(semi_id)
        expect(updated_available[semi_id]).to eq(98) # 99 - 1
      end
    end

    context 'when IDs are already taken' do
      let(:person_name) { 'John Doe' }

      before do
        create(:person, wca_id: '2023DOEJ01')
      end

      it 'adjusts the semi-ID to avoid conflicts' do
        semi_id, updated_available = described_class.compute_semi_id(competition_year, person_name, available_per_semi)

        expect(semi_id).to start_with('2023')
        expect(semi_id).to eq('2023DOEJ02') # Next available ID
        expect(updated_available[semi_id]).to be < 99
      end
    end

    context 'when no semi-ID can be generated' do
      let(:person_name) { 'John Doe' }

      before do
        create(:person, wca_id: '2023DOEJ99')
      end

      it 'raises an error' do
        expect do
          described_class.compute_semi_id(competition_year, person_name, available_per_semi)
        end.to raise_error(RuntimeError, /Could not compute a semi-id for John Doe/)
      end
    end

    context 'when the name includes a generational suffix' do
      let(:person_name) { 'John Doe Jr.' }

      it 'ignores the generational suffix and generates the correct semi-ID' do
        create(:person, :no_wca_id)
        semi_id, updated_available = described_class.compute_semi_id(competition_year, person_name, available_per_semi)

        expect(semi_id).to start_with('2023')
        expect(semi_id).to include('DOEJ') # Ensure the suffix is ignored
        expect(updated_available).to have_key(semi_id)
        expect(updated_available[semi_id]).to eq(98) # 99 - 1
      end
    end
  end
end
