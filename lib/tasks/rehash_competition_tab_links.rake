# frozen_string_literal: true

namespace :competition_tabs do
  desc "Rehash links in tabs with SHA256 digest"
  task rehash_active_record_links: [:environment] do
    key_generator = ActiveSupport::CachingKeyGenerator.new(
      ActiveSupport::KeyGenerator.new(Rails.application.secret_key_base,
                                      iterations: 1000,
                                      hash_digest_class: OpenSSL::Digest::SHA1),
    )

    # It's just called like that. Copied from the Rails source code.
    secret = key_generator.generate_key('ActiveStorage')
    verifier = ActiveSupport::MessageVerifier.new(secret)

    rehash_links(CompetitionTab, :content, verifier)
    rehash_links(Competition, :information, verifier)
    rehash_links(Competition, :extra_registration_requirements, verifier)
    rehash_links(DelegateReport, :equipment, verifier)
    rehash_links(DelegateReport, :venue, verifier)
    rehash_links(DelegateReport, :organization, verifier)
    rehash_links(DelegateReport, :incidents, verifier)
    rehash_links(DelegateReport, :remarks, verifier)
    rehash_links(Post, :body, verifier)
  end

  def rehash_links(model, column, legacy_verifier)
    puts "Re-hashing field #{column} in model #{model}"
    puts ''

    model.find_each do |row|
      # find_each finds in batches of 1,000 by default
      content = row.send(column)

      next if content.nil?

      if row.respond_to?(:competition_id)
        puts "Processing #{row.id} for competition #{row.competition_id}"
      else
        puts "Processing #{row.id}"
      end

      new_content = content.gsub(/!\[(.*?)\]\((.+?)\)/) do
        img_description = Regexp.last_match(1)
        url = Regexp.last_match(2)

        rehashed_url = url.gsub(%r{https?://(?:www\.)?worldcubeassociation\.org/rails/active_storage/blobs(?:/redirect)?/(\w+--\w+)/(.+)}) do |old_url|
          old_signed_id = Regexp.last_match(1)

          active_storage_id = legacy_verifier.verify(old_signed_id, purpose: 'blob_id')
          active_storage_blob = ActiveStorage::Blob.find(active_storage_id)

          new_signed_id = active_storage_blob.signed_id
          old_url.sub(old_signed_id, new_signed_id)
        rescue ActiveSupport::MessageVerifier::InvalidSignature
          old_url
        end

        "![#{img_description}](#{rehashed_url})"
      end

      if new_content != content
        puts "Was: #{content}"
        puts "Is: #{new_content}"
        puts ''

        row.update_attribute(column, new_content)
      end
    end
  end
end
