# frozen_string_literal: true

require "rails_helper"

RSpec.describe MarkdownHelper do
  describe "#md" do
    it "turns the custom youtube markup into an embed video" do
      expect(helper.md("youtube(https://www.youtube.com/watch?v=VIDEO)")).to include(
        "<iframe width='640' height='390' frameborder='0' src='https://www.youtube.com/embed/VIDEO'></iframe>",
      )
    end
  end
end
