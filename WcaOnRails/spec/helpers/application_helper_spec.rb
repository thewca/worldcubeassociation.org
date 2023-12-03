# frozen_string_literal: true

require "rails_helper"

RSpec.describe ApplicationHelper do
  describe "#alert" do
    it "escapes note" do
      string = helper.alert(:warning, "good job", note: true)
      expect(string).to eq '<div class="alert alert-warning"><strong>Note:</strong> good job</div>'
    end
  end

  describe "#users_to_sentence" do
    it "escapes name" do
      users = []
      users << FactoryBot.create(:user, name: "Jonatan")
      users << FactoryBot.create(:user, name: "Pedro")
      users << FactoryBot.create(:user, name: "Jeremy O'Fleischman")
      string = helper.users_to_sentence(users)
      expect(string).to eq 'Jeremy O&#39;Fleischman, Jonatan, and Pedro'
    end

    it "includes email" do
      users = []
      FactoryBot.create(:person, name: "Jonatan O'Klosko", wca_id: "2013KOSK01")
      users << FactoryBot.create(:user_with_wca_id, name: "Jonatan O'Klosko", wca_id: "2013KOSK01")
      users << FactoryBot.create(:user, name: "Jeremy")
      string = helper.users_to_sentence(users, include_profile: true)
      expect(string).to eq 'Jeremy and <a href="/persons/2013KOSK01">Jonatan O&#39;Klosko</a>'
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

  describe "#simple_form_for" do
    it "error messages link to attribute input field" do
      user = FactoryBot.create :user
      user.wca_id = '1999FLEI01'
      user.dob = 2.days.from_now
      expect(user).to be_invalid_with_errors(
        wca_id: ["not found"],
        dob: ["must be in the past"],
      )

      form_html = helper.simple_form_for(user) do |f|
        buf = ""
        buf += f.input :name
        buf += f.input :dob
        buf += f.hidden_field :wca_id
        buf
      end

      expect(form_html).to include "The form contains 2 errors"

      # Test that our error messages internally link to the correct field to make user's lives easier.
      # We cannot link to the appropriate field if the field does not exist, however.
      expect(form_html).not_to include '<a href="#user_name">' # no error, so there should not be a link
      expect(form_html).to include '<a href="#user_dob">' # there was an error with this field, and the field was created, so we should link directly to it
      expect(form_html).not_to include '<a href="#user_senior_delegate">' # there was an error with this field, but we did not create this field, so we should not link to it
      expect(form_html).not_to include '<a href="#user_wca_id">' # there was an error with this field, but the field was hidden, so we should not link to it
    end
  end

  describe "#wca_id_link" do
    it "links to a person's WCA profile page" do
      expect(wca_id_link("2005FLEI01")).to eq "<span class=\"wca-id\"><a href=\"#{person_url "2005FLEI01"}\">2005FLEI01</a></span>"
    end
  end

  describe "#format_money" do
    it "formats 6.9 United States Dollars" do
      expect(format_money(Money.new(690, "USD"))).to eq "$6.90 (United States Dollar)"
    end

    it "formats 135 Czech Korunas" do
      expect(format_money(Money.new(135*100, "CZK"))).to eq "135 Kč (Czech Koruna)"
    end

    it "formats 135 New Taiwanese Dollars" do
      expect(format_money(Money.new(450, "TWD"))).to eq "$4.50 (New Taiwan Dollar)"
    end
  end
end
