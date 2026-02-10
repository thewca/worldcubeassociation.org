# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FinishUnfinishedPersons, type: :module do
  describe '.name_parts_without_suffix' do
    {
      'John Smith' => %w[JOHN SMITH],
      'John Smith Jr' => %w[JOHN SMITH],
      'John Smith Jr.' => %w[JOHN SMITH],
      'John Smith Sr' => %w[JOHN SMITH],
      'John Smith Jnr' => %w[JOHN SMITH],
      'John Smith Snr' => %w[JOHN SMITH],
      'John Smith II' => %w[JOHN SMITH],
      'John Smith III' => %w[JOHN SMITH],
      'John Smith IV' => %w[JOHN SMITH],
      'Jr' => %w[JR],
      'José García' => %w[JOSE GARCIA],
      'Takeshi Yamada (山田武)' => %w[TAKESHI YAMADA],
      "John O'Connor" => %w[JOHN OCONNOR],
      'John Silver' => %w[JOHN SILVER],
      'John Michael David Smith Jr' => %w[JOHN MICHAEL DAVID SMITH],
    }.each do |input, expected|
      it "returns #{expected} for '#{input}'" do
        expect(described_class.name_parts_without_suffix(input)).to eq(expected)
      end
    end
  end

  describe '.compute_semi_id' do
    let(:competition_year) { 2023 }
    let(:available_per_semi) { {} }

    context 'with a simple name' do
      let(:person) { create(:person, name: 'John Smith') }

      it 'generates a semi_id with the correct format' do
        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to match(/\A2023[A-Z]{4}\z/)
        expect(semi_id).to start_with('2023SMIT')
        expect(available_per_semi[semi_id]).to be >= 0
      end
    end

    context 'with a generational suffix' do
      let(:person) { create(:person, name: 'John Smith Jr.') }

      it 'correctly identifies the last name and generates a semi_id' do
        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023SMIT')
      end
    end

    context 'with an extended generational suffix' do
      let(:person) { create(:person, name: 'John Smith III') }

      it 'correctly identifies the last name for JNR' do
        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023SMIT')
      end
    end

    context 'with accented characters' do
      let(:person) { create(:person, name: 'José García') }

      it 'handles accented characters correctly' do
        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023GARC')
      end
    end

    context 'with a single name part' do
      let(:person) { create(:person, name: 'Madonna') }

      it 'uses the single name as the last name' do
        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023MADO')
      end
    end

    context 'with a name containing special characters' do
      let(:person) { create(:person, name: 'John O\'Connor') }

      it 'sanitizes special characters' do
        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023OCON')
      end
    end
  end
end
