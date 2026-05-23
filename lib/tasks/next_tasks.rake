# frozen_string_literal: true

namespace :next do
  namespace :posts do
    desc "Import Posts into nextjs, usage: ./bin/rake next:posts:import[nextjs_url] or [nextjs_url,2024-01-01] with start date"
    task :import, %i[next_url start_date] => [:environment] do |_task, args|
      abort "NextJS Url is required" if args[:next_url].blank?

      posts = Post.all
      posts = posts.where(created_at: Date.parse(args[:start_date])..) if args[:start_date].present?

      connection = Faraday.new(
        url: args[:next_url],
        headers: {
          'Content-Type' => 'application/json',
          'Authorization' => "Bearer #{AppSecrets.PAYLOAD_SYNC_KEY}",
        },
        &FaradayConfig
      )
      posts.find_in_batches(batch_size: 10) do |batch|
        connection.post("/api/wca/import-posts") do |req|
          req.body = batch.to_json(
            teaser_only: false,
            include: [{ author: { only: %i[email name] }, post_tags: { only: [:tag] } }],
            only: %w[id slug title sticky created_at unstick_at],
          )
        end
      end
    end
  end
end
