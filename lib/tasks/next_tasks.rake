namespace :next do
  namespace :posts do
    desc "Import Posts into nextjs"
    task :import, :environment do
      connection = Faraday.new(
        url: EnvConfig.NEXTJS_URL,
        headers: {
          'Content-Type' => 'application/json',
        },
        &FaradayConfig
      )
      connection.post("/api/wca/import-posts") do |req|
        req.body = Post.all.sample(1).to_json(teaser_only: false)
      end
    end
  end
end
