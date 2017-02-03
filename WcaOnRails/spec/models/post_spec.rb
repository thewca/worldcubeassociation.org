# frozen_string_literal: true
require 'rails_helper'

RSpec.describe Post do
  it "has a valid factory" do
    expect(FactoryGirl.create :post).to be_valid
  end

  it "delegates crash course post is not world_readable" do
    expect(Post.crash_course_post.world_readable).to be false
  end

  it "displays body teaser and body full when break present" do
    post = FactoryGirl.build :post, title: "My First Post", slug: "my-first-post", body: "This post has a preview.<!--break--> And some more text."
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
    post = FactoryGirl.build :post, title: "My Second Post", slug: "my-second-post", body: "This post does not have a preview."
    expect(post.body_teaser).to eq post.body
    expect(post.body_full).to eq post.body
  end
end
