# frozen_string_literal: true

ActiveRecordQueryTrace.enabled = Rails.env.development? && EnvConfig.ENABLE_QUERY_TRACES?
