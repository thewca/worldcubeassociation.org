# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Posts page", :js do
  scenario "renders the posts React on Rails component" do
    # `:js` specs use the truncation DB strategy, so this committed post is visible
    # to the Capybara server thread and returned by the posts endpoint.
    post = create(:post, title: "A Very Specific Test Announcement")

    visit "/posts"

    # The PostsWidget component fetches posts from the API and renders each title,
    # so seeing the title proves the React component rendered the fetched data.
    expect(page).to have_text(post.title)
  end
end
