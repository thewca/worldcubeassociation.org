# frozen_string_literal: true

Octokit.configure do |c|
  c.access_token = ENVied.GITHUB_BOT_ACCESS_TOKEN
end
