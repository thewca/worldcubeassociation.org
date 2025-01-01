# frozen_string_literal: true

module Admin
  class AvatarsController < AdminController
    def pending_avatar_users
      render json: User.where.not(pending_avatar: nil).as_json({ methods: %w[staff_or_any_delegate? avatar_history current_avatar_id pending_avatar] })
    end

    def update_avatar
      avatar_id = params.require(:avatar_id)
      avatar_action = params.require(:avatar_action)
      rejection_reason = params[:rejection_reason] || ''
      rejection_guidelines = params[:rejection_guidelines] || []

      ActiveRecord::Base.transaction do
        avatar = UserAvatar.pending.find(avatar_id)

        case avatar_action
        when "approve"
          avatar.status = UserAvatar.statuses[:approved]
          avatar.approved_by_user = current_user
        when "reject"
          avatar.status = UserAvatar.statuses[:rejected]

          combined_reasons = (rejection_guidelines + [rejection_reason]).compact.join(" ")

          avatar.revoked_by_user = current_user
          avatar.revocation_reason = combined_reasons

          user = avatar.pending_user
          AvatarsMailer.notify_user_of_avatar_rejection(user, combined_reasons).deliver_later
        else
          raise "Unrecognized avatar action '#{avatar_action}'"
        end

        avatar.save!
      end
      render json: { status: :ok }
    end
  end
end
