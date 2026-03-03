# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    # For Live we don't care about only letting authenticated users connect
    # We might want to change this for other use cases

    # identified_by :current_user
    #
    def connect
      reject_unauthorized_connection unless Live::Config.enabled?
    end
    #
    # private
    #
    # def find_verified_user
    #   user_id = cookies.encrypted["_WcaOnRails_session"]["warden.user.user.key"][0]
    #   if (verified_user = User.find_by(id: user_id))
    #     verified_user
    #   else
    #     reject_unauthorized_connection
    #   end
    # end
  end
end
