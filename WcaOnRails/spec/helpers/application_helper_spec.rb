# frozen_string_literal: true
require "rails_helper"

describe ApplicationHelper do
  describe "#alert" do
    it "escapes note" do
      string = helper.alert(:warning, "good job", note: true)
      expect(string).to eq '<div class="alert alert-warning"><strong>Note:</strong> good job</div>'
    end
  end

  describe "#users_to_sentence" do
    it "escapes name" do
      users = []
      users << FactoryGirl.create(:user, name: "Jonatan")
      users << FactoryGirl.create(:user, name: "Pedro")
      users << FactoryGirl.create(:user, name: "Jeremy O'Fleischman")
      string = helper.users_to_sentence(users)
      expect(string).to eq 'Jeremy O&#39;Fleischman, Jonatan, and Pedro'
    end

    it "includes email" do
      users = []
      users << FactoryGirl.create(:user, name: "Jonatan O'Klosko", email: "jonatan@worldcubeassociation.org")
      users << FactoryGirl.create(:user, name: "Jeremy", email: "jfly@worldcubeassociation.org")
      string = helper.users_to_sentence(users, include_email: true)
      expect(string).to eq '<a href="mailto:jfly@worldcubeassociation.org">Jeremy</a> and <a href="mailto:jonatan@worldcubeassociation.org">Jonatan O&#39;Klosko</a>'
    end
  end

  describe "#wca_excerpt" do
    it "handles multiple phrases correctly highlighting them" do
      text = "A long text with a super word in the middle (directly here) followed by the rest of an awesome and peculiar sentence. What do you think?"
      expected = "...t with a super word in the middle (directly here) <strong>followed</strong> by the rest of an awesome and peculiar sentence. What do you <strong>think</strong>?"
      expect(helper.wca_excerpt(text, %w(followed think))).to eq expected
    end

    it "is case insensitive" do
      divider = (["thing"] * 15).join(' ')
      text = "Some #{divider} match #{divider} end."
      expected = "<strong>Some</strong> #{divider} <strong>match</strong> #{divider} <strong>end</strong>."
      expect(helper.wca_excerpt(text, %w(some match END))).to eq expected
    end
  end
end
