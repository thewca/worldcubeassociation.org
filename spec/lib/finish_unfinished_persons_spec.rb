# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FinishUnfinishedPersons, type: :module do
  describe '.compute_semi_id' do
    let(:competition_year) { 2023 }
    let(:available_per_semi) { {} }

    context 'with a simple name' do
      let(:person) { build(:person, name: 'John Smith') }

      it 'generates a semi_id with the correct format' do
        allow(FinishUnfinishedPersons).to receive(:extract_roman_name).with('John Smith').and_return('John Smith')
        allow(FinishUnfinishedPersons).to receive(:remove_accents).with('John Smith').and_return('John Smith')

        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to match(/\A2023[A-Z]{4}\z/)
        expect(semi_id).to start_with('2023SMIT')
        expect(available_per_semi[semi_id]).to be >= 0
      end
    end

    context 'with a generational suffix' do
      let(:person) { build(:person, name: 'John Smith Jr') }

      it 'correctly identifies the last name and generates a semi_id' do
        allow(FinishUnfinishedPersons).to receive(:extract_roman_name).with('John Smith Jr').and_return('John Smith Jr')
        allow(FinishUnfinishedPersons).to receive(:remove_accents).with('John Smith Jr').and_return('John Smith Jr')

        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023SMIT')
      end
    end

    context 'with an extended generational suffix' do
      let(:person) { build(:person, name: 'John Smith Jnr') }

      it 'correctly identifies the last name for JNR' do
        allow(FinishUnfinishedPersons).to receive(:extract_roman_name).with('John Smith Jnr').and_return('John Smith Jnr')
        allow(FinishUnfinishedPersons).to receive(:remove_accents).with('John Smith Jnr').and_return('John Smith Jnr')

        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023SMIT')
      end
    end

    context 'with accented characters' do
      let(:person) { build(:person, name: 'José García') }

      it 'handles accented characters correctly' do
        allow(FinishUnfinishedPersons).to receive(:extract_roman_name).with('José García').and_return('Jose Garcia')
        allow(FinishUnfinishedPersons).to receive(:remove_accents).with('Jose Garcia').and_return('Jose Garcia')

        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023GARC')
      end
    end

    context 'with a single name part' do
      let(:person) { build(:person, name: 'Madonna') }

      it 'uses the single name as the last name' do
        allow(FinishUnfinishedPersons).to receive(:extract_roman_name).with('Madonna').and_return('Madonna')
        allow(FinishUnfinishedPersons).to receive(:remove_accents).with('Madonna').and_return('Madonna')

        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023MADO')
      end
    end

    context 'with a name containing special characters' do
      let(:person) { build(:person, name: 'John O\'Connor') }

      it 'sanitizes special characters' do
        allow(FinishUnfinishedPersons).to receive(:extract_roman_name).with('John O\'Connor').and_return('John OConnor')
        allow(FinishUnfinishedPersons).to receive(:remove_accents).with('John OConnor').and_return('John OConnor')

        semi_id, = FinishUnfinishedPersons.compute_semi_id(competition_year, person.name, available_per_semi)

        expect(semi_id).to start_with('2023OCON')
      end
    end
  end
end
