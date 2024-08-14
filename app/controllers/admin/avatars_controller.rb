# frozen_string_literal: true

module Admin
  class AvatarsController < AdminController
    def index
      @users = User.where.not(pending_avatar: nil)
    end

    def update_all
      avatars = params.require(:avatars)
      ActiveRecord::Base.transaction do
        avatars.each do |wca_id, args|
          user = User.find_by_wca_id!(wca_id)
          case args[:action]
          when "approve"
            user.approve_pending_avatar!
          when "reject"
            user.remove_pending_avatar = true
            rejection_guidelines = args[:rejection_guidelines] || []
            additional_reason = args[:rejection_reason].presence
            combined_reasons = (rejection_guidelines + [additional_reason]).compact.join(" ")
            user.save!
            AvatarsMailer.notify_user_of_avatar_rejection(user, args[:combined_reasons]).deliver_later
          when "defer"
            # do nothing!
          else
            raise "Unrecognized avatar action '#{args[:action]}'"
          end
        end
      end
      redirect_to admin_avatars_path
    end
  end
end
