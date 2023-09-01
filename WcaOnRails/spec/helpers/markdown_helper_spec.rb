# frozen_string_literal: true

require "rails_helper"

RSpec.describe MarkdownHelper do
  describe "#md" do
    it "turns the custom youtube markup into an embed video" do
      expect(helper.md("youtube(https://www.youtube.com/watch?v=VIDEO)")).to include(
        "<iframe width='640' height='390' frameborder='0' src='https://www.youtube.com/embed/VIDEO'></iframe>",
      )
    end

    it "with table of contents, generates links to every header" do
      expect(helper.md("# Foo Bar", toc: true)).to eq '<ul>
<li>
<a href="#foo-bar">Foo Bar</a>
</li>
</ul>
<h1><span id=\'foo-bar\' class=\'anchorable\'><a href=\'#foo-bar\'><span class=\'linkify icon\'></span></a> Foo Bar</span></h1>
'
    end
  end
end
