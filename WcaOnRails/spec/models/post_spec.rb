# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Post do
  it "has a valid factory" do
    expect(FactoryBot.create(:post)).to be_valid
  end

  it "delegates crash course post is not world_readable" do
    expect(Post.delegate_crash_course_post.world_readable).to be false
  end

  it "displays body teaser and body full when break present" do
    post = FactoryBot.build :post, title: "My First Post", slug: "my-first-post", body: "This post has a preview.<!--break--> And some more text."
    expect(post.body_teaser).to eq "This post has a preview.\n\n[Read more....](/posts/my-first-post)"
    expect(post.body_full).to eq "This post has a preview. And some more text."
    post.body = "This post also has a preview.<!-- break --> And then some more text."
    expect(post.body_teaser).to eq "This post also has a preview.\n\n[Read more....](/posts/my-first-post)"
    expect(post.body_full).to eq "This post also has a preview. And then some more text."
    post.body = "This post also has a preview.<!--     break   --> And then some more text."
    expect(post.body_teaser).to eq "This post also has a preview.\n\n[Read more....](/posts/my-first-post)"
    expect(post.body_full).to eq "This post also has a preview. And then some more text."
  end

  it "displays body teaser and body full when break not present" do
    post = FactoryBot.build :post, title: "My Second Post", slug: "my-second-post", body: "This post does not have a preview."
    expect(post.body_teaser).to eq post.body
    expect(post.body_full).to eq post.body
  end

  context "tags" do
    let(:post) { FactoryBot.create(:post) }

    it "can tag posts with a comma separated list" do
      expect(post.tags_array).to match_array %w()

      post.update!(tags: "wdc, test-with-hyphens")
      expect(Post.find(post.id).tags_array).to match_array %w(wdc test-with-hyphens)

      post.update!(tags: "wdc")
      expect(Post.find(post.id).tags_array).to match_array %w(wdc)
    end

    it "tags must not have spaces" do
      post.update!(tags: "wdc")
      expect(Post.find(post.id).tags_array).to match_array %w(wdc)

      expect(post.update(tags: "wdc,test tag with spaces")).to eq false
      expect(post).to be_invalid_with_errors("post_tags.tag": ["only allows English letters, numbers, hyphens, and '+'"])

      expect(Post.find(post.id).tags_array).to match_array %w(wdc)
    end
  end
end
