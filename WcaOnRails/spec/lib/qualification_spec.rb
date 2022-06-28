# frozen_string_literal: true

RSpec.describe Qualification do
  context "Single" do
    it "requires single" do
      input = {
        'resultType' => 'single',
        'type' => 'ranking',
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "requires date" do
      input = {
        'resultType' => 'single',
        'type' => 'ranking',
        'level' => 1000,
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "requires type" do
      input = {
        'resultType' => 'single',
        'level' => 1000,
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "parses correctly" do
      input = {
        'resultType' => 'single',
        'type' => 'attemptResult',
        'whenDate' => '2021-06-01',
        'level' => 1000,
      }
      model = Qualification.load(input)
      expect(model).to be_valid
    end

    it "parses anyResult correctly" do
      input = {
        'resultType' => 'single',
        'type' => 'anyResult',
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_valid
    end
  end

  context "Average" do
    it "requires average" do
      input = {
        'resultType' => 'average',
        'type' => 'attemptResult',
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "requires date" do
      input = {
        'resultType' => 'average',
        'type' => 'attemptResult',
        'level' => 1000,
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "requires type" do
      input = {
        'resultType' => 'average',
        'level' => 1000,
        'whenDate' => '2021-06-01',
      }
      model = Qualification.load(input)
      expect(model).to be_invalid
    end

    it "parses correctly" do
      input = {
        'resultType' => 'average',
        'type' => 'attemptResult',
        'whenDate' => '2021-06-01',
        'level' => 1000,
      }
      model = Qualification.load(input)
      expect(model).to be_valid
    end
  end
end
