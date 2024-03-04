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
            user.save!
            AvatarsMailer.notify_user_of_avatar_rejection(user, args[:rejection_reason]).deliver_later
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
