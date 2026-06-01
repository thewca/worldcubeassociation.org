# frozen_string_literal: true

# Mitigate the single-use refresh_token race condition.
#
# Doorkeeper rotates refresh tokens on use: the old refresh_token is revoked
# and the request fails for any concurrent caller arriving with the same
# token. In practice this surfaces as Next.js sessions being kicked out when
# two requests refresh at the same instant. We give the loser a short grace
# window in which it receives the same access_token the winner produced,
# rather than `invalid_grant`.
#
# Mechanics:
#   1. Always populate `previous_refresh_token` on the new access_token row,
#      so we can identify the rotation that consumed a given refresh_token
#      (Doorkeeper only sets this in `refresh_token_revoked_on_use` mode).
#   2. In the refresh flow, if the supplied refresh_token is already revoked
#      but a replacement was issued within GRACE_PERIOD, short-circuit and
#      return that replacement.
#
# Reuse detection is preserved: outside the window, or once the replacement
# has itself been rotated, `invalid_grant` still fires.
Rails.application.config.to_prepare do
  module DoorkeeperRefreshTokenGrace
    GRACE_PERIOD = 30.seconds

    def validate_token
      super || grace_replacement.present?
    end

    def before_successful_response
      if (replacement = grace_replacement)
        @access_token = replacement
        return
      end
      super
    end

    private

    def create_access_token
      super
      return if @access_token.blank?
      return if @access_token.previous_refresh_token.present?

      @access_token.update_columns(previous_refresh_token: refresh_token.refresh_token)
    end

    def grace_replacement
      return @grace_replacement if defined?(@grace_replacement)

      @grace_replacement = lookup_grace_replacement
    end

    def lookup_grace_replacement
      return nil if refresh_token.blank?
      return nil unless refresh_token.revoked?

      model = Doorkeeper.config.access_token_model
      replacement = model.by_previous_refresh_token(refresh_token.refresh_token)
      return nil if replacement.nil?
      return nil if replacement.revoked?
      return nil if replacement.created_at < GRACE_PERIOD.ago

      replacement
    end
  end

  Doorkeeper::OAuth::RefreshTokenRequest.prepend(DoorkeeperRefreshTokenGrace)
end