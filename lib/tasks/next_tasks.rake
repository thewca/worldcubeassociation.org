namespace :next do
  namespace :posts do
    desc "Import Posts into nextjs"
    task :import, [:next_url] => [:environment] do
      abort "NextJS Url is required" if args[:next_url].blank?

      connection = Faraday.new(
        url: args[:next_url],
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
