# frozen_string_literal: true

require "rails_helper"

# In production, we see lots of requests that correspond to an HTTP_ACCEPT
# header of "*/*;", which causes Rails to complain about a missing template.
# curl -v -H "Accept: */*;" http://localhost:3000
RSpec.describe "HTTP_ACCEPT" do
  include Capybara::DSL

  it 'handles malformed HTTP_ACCEPT' do
    get root_url, params: { "HTTP_ACCEPT" => "*/*;" }
    expect(response).to be_successful
  end

  it 'rss' do
    get rss_url, params: { "HTTP_ACCEPT" => "text/plain" }
    expect(response).to be_successful
  end
end
