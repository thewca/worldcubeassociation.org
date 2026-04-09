# frozen_string_literal: true

# Rubocop is trying to suggest a post-fix `enabled = ... if Rails.env.development?`
#   but we actually need this to be *nested inside* an if-block
#   because non-dev environments (test, prod) don't even know that
#   such a thing as `ActiveRecordQueryTrace` exists in the first place
# rubocop:disable Style/IfUnlessModifier
if Rails.env.development?
  ActiveRecordQueryTrace.enabled = EnvConfig.ENABLE_QUERY_TRACES?
end
# rubocop:enable Style/IfUnlessModifier
