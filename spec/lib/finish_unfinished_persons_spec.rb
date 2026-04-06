# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FinishUnfinishedPersons, type: :module do
  shared_examples 'name_parts_without_suffix' do |input, expected|
    it "returns #{expected} for '#{input}'" do
      expect(described_class.name_parts_without_suffix(input)).to eq(expected)
    end
  end

  describe '.name_parts_without_suffix' do
    it_behaves_like 'name_parts_without_suffix', 'John Smith', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'John Smith Jr', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'John Smith Jr.', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'John Smith Sr', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'John Smith Jnr', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'John Smith Snr', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'John Smith II', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'John Smith III', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'John Smith IV', %w[John Smith]
    it_behaves_like 'name_parts_without_suffix', 'Jr', %w[Jr]
    it_behaves_like 'name_parts_without_suffix', 'José García', %w[Jose Garcia]
    it_behaves_like 'name_parts_without_suffix', 'Takeshi Yamada (山田武)', %w[Takeshi Yamada]
    it_behaves_like 'name_parts_without_suffix', "John O'Connor", %w[John OConnor]
    it_behaves_like 'name_parts_without_suffix', 'John Silver', %w[John Silver]
    it_behaves_like 'name_parts_without_suffix', 'John Michael David Smith Jr', %w[John Michael David Smith]
  end

  shared_examples 'name_parts' do |input, expected|
    it "returns #{expected} for '#{input}'" do
      expect(described_class.name_parts(input)).to eq(expected)
    end
  end

  describe '.name_parts' do
    it_behaves_like 'name_parts', 'John Smith', %w[John Smith]
    it_behaves_like 'name_parts', 'John Smith Jr', %w[John Smith Jr]
    it_behaves_like 'name_parts', 'John Smith Jr.', %w[John Smith Jr]
    it_behaves_like 'name_parts', 'John Smith Sr', %w[John Smith Sr]
    it_behaves_like 'name_parts', 'John Smith Jnr', %w[John Smith Jnr]
    it_behaves_like 'name_parts', 'John Smith Snr', %w[John Smith Snr]
    it_behaves_like 'name_parts', 'John Smith II', %w[John Smith II]
    it_behaves_like 'name_parts', 'John Smith III', %w[John Smith III]
    it_behaves_like 'name_parts', 'John Smith IV', %w[John Smith IV]
    it_behaves_like 'name_parts', 'Jr', %w[Jr]
    it_behaves_like 'name_parts', 'José García', %w[Jose Garcia]
    it_behaves_like 'name_parts', 'Takeshi Yamada (山田武)', %w[Takeshi Yamada]
    it_behaves_like 'name_parts', "John O'Connor", %w[John OConnor]
    it_behaves_like 'name_parts', 'John Silver', %w[John Silver]
    it_behaves_like 'name_parts', 'John Michael David Smith Jr', %w[John Michael David Smith Jr]
  end

  shared_examples 'last_name_with_suffix' do |input, expected|
    it "returns #{expected} for '#{input}'" do
      expect(described_class.last_name_with_suffix(input)).to eq(expected)
    end
  end

  describe '.last_name_with_suffix' do
    it_behaves_like 'last_name_with_suffix', 'John Smith', 'Smith'
    it_behaves_like 'last_name_with_suffix', 'John Smith Jr', 'Smith Jr'
    it_behaves_like 'last_name_with_suffix', 'John Smith Jr.', 'Smith Jr'
    it_behaves_like 'last_name_with_suffix', 'John Smith Sr', 'Smith Sr'
    it_behaves_like 'last_name_with_suffix', 'John Smith Jnr', 'Smith Jnr'
    it_behaves_like 'last_name_with_suffix', 'John Smith Snr', 'Smith Snr'
    it_behaves_like 'last_name_with_suffix', 'John Smith II', 'Smith II'
    it_behaves_like 'last_name_with_suffix', 'John Smith III', 'Smith III'
    it_behaves_like 'last_name_with_suffix', 'John Smith IV', 'Smith IV'
    it_behaves_like 'last_name_with_suffix', 'Jr', 'Jr'
    it_behaves_like 'last_name_with_suffix', 'José García', 'Garcia'
    it_behaves_like 'last_name_with_suffix', 'Takeshi Yamada (山田武)', 'Yamada'
    it_behaves_like 'last_name_with_suffix', "John O'Connor", 'OConnor'
    it_behaves_like 'last_name_with_suffix', 'John Silver', 'Silver'
    it_behaves_like 'last_name_with_suffix', 'John Michael David Smith Jr', 'Smith Jr'
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
