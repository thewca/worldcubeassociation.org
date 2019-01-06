# frozen_string_literal: true

require "rails_helper"

def assert_can_see(**kwargs)
  banned, edit_banned, posts = kwargs.values_at(:banned, :edit_banned, :posts)
  description = kwargs.map do |item, can_see|
    "#{(can_see ? "can" : "cannot")} see #{item}"
  end.join(", ")

  it description do
    get disciplinary_path
    expect(response).to be_successful

    if banned
      expect(response.body).to include "Banned"
    else
      expect(response.body).not_to include "Banned"
    end

    if posts
      expect(response.body).to include "Posts"
    else
      expect(response.body).not_to include "Posts"
    end

    if edit_banned
      expect(response.body).to include "Edit banned competitors"
    else
      expect(response.body).not_to include "Edit banned competitors"
    end
  end
end

RSpec.describe "wdc" do
  describe "GET /disciplinary" do
    context "when not signed in" do
      sign_out

      assert_can_see(
        banned: false,
        posts: true,
      )
    end

    context "when signed in as regular user" do
      sign_in { FactoryBot.create :user }

      assert_can_see(
        banned: false,
        posts: true,
      )
    end

    context "when signed in as a delegate" do
      sign_in { FactoryBot.create :delegate }

      assert_can_see(
        banned: true,
        posts: true,
      )
    end

    context "when signed in as wdc member" do
      sign_in { FactoryBot.create :user, :wdc_member }

      assert_can_see(
        banned: true,
        posts: true,
      )
    end

    context "when signed in as wdc leader" do
      sign_in { FactoryBot.create :user, :wdc_leader }

      assert_can_see(
        banned: true,
        edit_banned: true,
        posts: true,
      )
    end

    context "posts" do
      it "shows wdc posts, but not non-wdc posts" do
        FactoryBot.create :post, body: "This is an important WDC announcement", tags: 'wdc'
        FactoryBot.create :post, body: "Foobar"

        get disciplinary_path
        expect(response).to be_successful
        expect(response.body).to include "This is an important WDC announcement"
        expect(response.body).not_to include "Foobar"
      end
    end

    context "banned competitors" do
      sign_in { FactoryBot.create :delegate }

      it "shows banned competitors" do
        FactoryBot.create :user, :banned, name: "Joe Cheater"

        get disciplinary_path
        expect(response).to be_successful
        expect(response.body).to include "Joe Cheater"
      end
    end
  end
end
