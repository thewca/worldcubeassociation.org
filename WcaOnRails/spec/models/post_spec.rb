require 'rails_helper'

describe Post do
  it "has a valid factory" do
    expect(FactoryGirl.create :post).to be_valid
  end

  it "delegates crash course post is not world_readable" do
    expect(Post.crash_course_post.world_readable).to be false
  end
end
