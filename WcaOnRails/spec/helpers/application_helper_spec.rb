require "rails_helper"

describe ApplicationHelper do
  describe "#alert" do
    it "escapes note" do
      string = helper.alert(:warning, "good job", note: true)
      expect(string).to eq '<div class="alert alert-warning"><strong>Note:</strong> good job</div>'
    end
  end
end
