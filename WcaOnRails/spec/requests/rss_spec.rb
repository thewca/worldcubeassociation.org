require "rails_helper"

describe "rss" do
  include Capybara::DSL

  it 'rss smoke test' do
    post = FactoryGirl.create :post, created_at: Time.now
    sticky_post = FactoryGirl.create :post, sticky: true, created_at: 1.hours.ago
    get rss_path, format: :xml
    expect(response).to be_success
  end
end
