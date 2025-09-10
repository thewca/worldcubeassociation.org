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
      Post.find_in_batches(batch_size: 10) do |batch|
        connection.post("/api/wca/import-posts") do |req|
          req.body = batch.to_json(
            teaser_only: false,
            include: [author: { only: [:email] }],
            only: %w[id slug title sticky created_at unstick_at]
          )
        end
      end
    end
  end
end
