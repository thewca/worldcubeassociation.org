# frozen_string_literal: true

namespace :cleanup do
  desc "Removes stale WCA ID claims where the WCA ID has already been assigned to another user"
  task :unclaimed_wca_ids, [:limit] => [:environment] do |_, args|
    already_claimed_wca_ids = User.not_dummy_account.where.not(wca_id: nil).select(:wca_id)

    stale_claims = User.where.not(unconfirmed_wca_id: nil).where(unconfirmed_wca_id: already_claimed_wca_ids)

    total = stale_claims.count
    limit = (args[:limit] || total).to_i
    puts "Found #{total} stale WCA ID claims, processing #{limit}"

    stale_claims.limit(limit).each do |user|
      wca_id = user.unconfirmed_wca_id
      WcaIdClaimMailer.notify_user_of_claim_cancelled(user, wca_id).deliver_later
      user.update_columns(unconfirmed_wca_id: nil, delegate_id_to_handle_wca_id_claim: nil)
      puts "Cleared stale claim for user #{user.id} (#{user.email}) - WCA ID #{wca_id}"
    end

    puts "Successfully cleared #{[limit, total].min} stale claims" if total.positive?
  end
end
