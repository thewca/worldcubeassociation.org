# frozen_string_literal: true

module Admin
  class AvatarsController < AdminController
    def index
      @users = User.where.not(pending_avatar: nil)
    end

    def update_all
      avatars = params.require(:avatars)

      ActiveRecord::Base.transaction do
        avatars.each do |avatar_id, args|
          avatar = UserAvatar.pending.find(avatar_id)

          case args[:action]
          when "approve"
            avatar.status = UserAvatar.statuses[:approved]
            avatar.approved_by_user = current_user
          when "reject"
            avatar.status = UserAvatar.statuses[:rejected]

            rejection_guidelines = args[:rejection_guidelines] || []
            additional_reason = args[:rejection_reason].presence
            combined_reasons = (rejection_guidelines + [additional_reason]).compact.join(" ")

            avatar.revoked_by_user = current_user
            avatar.revocation_reason = combined_reasons

            user = avatar.pending_user
            AvatarsMailer.notify_user_of_avatar_rejection(user, combined_reasons).deliver_later
          when "defer"
            # do nothing!
          else
            raise "Unrecognized avatar action '#{args[:action]}'"
          end

          avatar.save!
        end
      end
      redirect_to admin_avatars_path
    end
  end
end
