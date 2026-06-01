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
#   1. After a successful rotation, remember the mapping
#        SHA256(old refresh_token) => new access_token id
#      in Rails.cache for GRACE_PERIOD seconds.
#   2. When a refresh request arrives with an already-revoked refresh_token,
#      look up that mapping. If present and the replacement is still valid,
#      short-circuit and return the replacement instead of raising.
#
# Reuse detection is preserved: outside the window, or once the cache entry
# has been replaced by a subsequent rotation, `invalid_grant` still fires.
Rails.application.config.to_prepare do
  module DoorkeeperRefreshTokenGrace
    GRACE_PERIOD = 30.seconds
    CACHE_NAMESPACE = "doorkeeper:refresh_grace"

    def self.cache_key(refresh_token)
      digest = Digest::SHA256.hexdigest(refresh_token)
      "#{CACHE_NAMESPACE}:#{digest}"
    end

    def self.remember_rotation(old_refresh_token, new_access_token_id)
      Rails.cache.write(
        cache_key(old_refresh_token),
        new_access_token_id,
        expires_in: GRACE_PERIOD,
      )
    end

    def self.lookup_rotation(old_refresh_token)
      Rails.cache.read(cache_key(old_refresh_token))
    end

    module RequestPatch
      def validate_token
        super || grace_replacement.present?
      end

      def before_successful_response
        if (replacement = grace_replacement)
          @access_token = replacement
          return
        end

        super

        DoorkeeperRefreshTokenGrace.remember_rotation(
          refresh_token.refresh_token,
          @access_token.id,
        ) if @access_token.present?
      end

      private

      def grace_replacement
        return @grace_replacement if defined?(@grace_replacement)

        @grace_replacement = lookup_grace_replacement
      end

      def lookup_grace_replacement
        return nil if refresh_token.blank?
        return nil unless refresh_token.revoked?

        replacement_id = DoorkeeperRefreshTokenGrace.lookup_rotation(refresh_token.refresh_token)
        return nil if replacement_id.blank?

        replacement = Doorkeeper.config.access_token_model.find_by(id: replacement_id)
        return nil if replacement.nil?
        return nil if replacement.revoked?

        replacement
      end
    end
  end

  Doorkeeper::OAuth::RefreshTokenRequest.prepend(DoorkeeperRefreshTokenGrace::RequestPatch)
end