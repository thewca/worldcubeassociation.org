# frozen_string_literal: true

Octokit.configure do |c|
  c.access_token = read_secret("GITHUB_CREATE_PR_ACCESS_TOKEN")
end
