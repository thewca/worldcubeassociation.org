module Users
  class AvatarsController < ApplicationController
    before_action :authenticate_user!
    before_action :can_admin_results_only

    def index
      @users = User.where.not(pending_avatar: nil)
    end

    def update_all
      avatars = params.select { |k| k.start_with?("avatar-") }
      ActiveRecord::Base.transaction do
        avatars.each do |k, v|
          wca_id = k.split('-', 2)[1]
          user = User.find_by_wca_id!(wca_id)
          case v
          when "approve"
            # Bypass the .avatar and .pending_avatar helpers that carrierwave creates
            # and write directly to the database.
            user.update_columns(
              avatar: user.read_attribute(:pending_avatar),
              avatar_crop_x: user.pending_avatar_crop_x, avatar_crop_y: user.pending_avatar_crop_y, avatar_crop_w: user.pending_avatar_crop_w, avatar_crop_h: user.pending_avatar_crop_h,
              pending_avatar: nil,
              pending_avatar_crop_x: nil, pending_avatar_crop_y: nil, pending_avatar_crop_w: nil, pending_avatar_crop_h: nil,
            )
          when "reject"
            user.remove_pending_avatar = true
            user.save!
          when "defer"
            # do nothing!
          else
            throw "Unrecognized avatar action #{v}"
          end
        end
      end
      redirect_to users_avatars_path
    end
  end
end
