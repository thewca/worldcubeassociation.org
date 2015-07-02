namespace :WcaOnRails do
  namespace :posts do
    # TODO remove me after all posts have been updated to markdown
    task :migrate_to_markdown => :environment do
      Post.transaction do
        Post.all.each do |post|
          post.update_attributes(body: ReverseMarkdown.convert(post.body))
        end
      end
    end
  end
end
