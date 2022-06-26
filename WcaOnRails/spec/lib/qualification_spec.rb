# frozen_string_literal: true

RSpec.describe Qualification do
  context "Single" do
    it "requires single" do
      input = {
        'type' => 'single',
        'method' => 'ranking',
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "requires date" do
      input = {
        'type' => 'single',
        'method' => 'ranking',
        'level' => 1000,
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "requires method" do
      input = {
        'type' => 'single',
        'level' => 1000,
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "parses correctly" do
      input = {
        'type' => 'single',
        'method' => 'result',
        'whenDate' => '2021-06-01',
        'level' => 1000,
      }
      model = Qualification.load(input)
      expect(model).to be_valid
    end
  end

  context "Average" do
    it "requires average" do
      input = {
        'type' => 'average',
        'method' => 'result',
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "requires date" do
      input = {
        'type' => 'average',
        'method' => 'result',
        'level' => 1000,
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "requires method" do
      input = {
        'type' => 'average',
        'level' => 1000,
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "parses correctly" do
      input = {
        'type' => 'average',
        'method' => 'result',
        'whenDate' => '2021-06-01',
        'level' => 1000,
      }
      model = Qualification.load(input)
      expect(model).to be_valid
    end
  end
end
