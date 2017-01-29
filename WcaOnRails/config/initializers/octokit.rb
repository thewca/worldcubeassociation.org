# frozen_string_literal: true
if ENVied.WCA_LIVE_SITE
  Octokit.configure do |c|
    c.access_token = ENVied.GITHUB_BOT_ACCESS_TOKEN
  end
end
