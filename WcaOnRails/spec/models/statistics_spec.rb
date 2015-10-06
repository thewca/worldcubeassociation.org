require 'rails_helper'

describe Statistics do
  describe '.merge' do
    let(:result) { Statistics.merge([list1, list2], spacer: :s, empty: :e) }

    context 'two empty lists' do
      let(:list1) { [] }
      let(:list2) { [] }

      it 'returns an empty array' do
        expect(result).to eq []
      end
    end

    context 'first list empty' do
      let(:list1) { [] }
      let(:list2) { [[1,2]] }

      it 'returns empty cells for the first list' do
        expect(result).to eq [[:e, :e, :s, 1, 2]]
      end
    end

    context 'second list empty' do
      let(:list1) { [[:a,:b]] }
      let(:list2) { [] }

      it 'returns empty cells for the second list' do
        expect(result).to eq [[:a, :b, :s, :e, :e]]
      end
    end

    context 'two lists equally long' do
      let(:list1) { [[:a,:b], [:c,:d]] }
      let(:list2) { [[1,2], [3,4]] }

      it 'zips them and fills the gaps' do
        expect(result).to eq [[:a, :b, :s, 1, 2],
                              [:c, :d, :s, 3, 4]]
      end
    end
  end
end
