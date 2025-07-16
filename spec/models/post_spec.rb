# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Post do
  it "has a valid factory" do
    expect(create(:post)).to be_valid
  end

  it "displays body teaser and body full when break present" do
    post = build(:post, title: "My First Post", slug: "my-first-post", body: "This post has a preview.<!--break--> And some more text.")
    expect(post.body_teaser).to eq "This post has a preview."
    expect(post.body_full).to eq "This post has a preview. And some more text."
    post.body = "This post also has a preview.<!-- break --> And then some more text."
    expect(post.body_teaser).to eq "This post also has a preview."
    expect(post.body_full).to eq "This post also has a preview. And then some more text."
    post.body = "This post also has a preview.<!--     break   --> And then some more text."
    expect(post.body_teaser).to eq "This post also has a preview."
    expect(post.body_full).to eq "This post also has a preview. And then some more text."
  end

  it "displays body teaser and body full when break not present" do
    post = build(:post, title: "My Second Post", slug: "my-second-post", body: "This post does not have a preview.")
    expect(post.body_teaser).to eq post.body
    expect(post.body_full).to eq post.body
  end

  context "tags" do
    let(:post) { create(:post) }

    it "can tag posts with a comma separated list" do
      expect(post.tags_array).to be_empty

      post.update!(tags: "wic, test-with-hyphens")
      expect(Post.find(post.id).tags_array).to match_array %w[wic test-with-hyphens]

      post.update!(tags: "wic")
      expect(Post.find(post.id).tags_array).to match_array %w[wic]
    end

    it "tags must not have spaces" do
      post.update!(tags: "wic")
      expect(Post.find(post.id).tags_array).to match_array %w[wic]

      expect(post.update(tags: "wic,test tag with spaces")).to be false
      expect(post).to be_invalid_with_errors('post_tags.tag': ["only allows English letters, numbers, hyphens, and '+'"])

      expect(Post.find(post.id).tags_array).to match_array %w[wic]
    end
  end

  context "unstick_at behavior" do
    it "defaults unstick_at to 2 weeks from now when sticky is true and unstick_at is nil" do
      post = create(:sticky_post, unstick_at: nil)
      expect(post).to be_valid
      expect(post.unstick_at).to eq(2.weeks.from_now.to_date)
    end
  end
end
