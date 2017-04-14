# frozen_string_literal: true

# Monkeypatch ActiveSupport's JSON encoder to prettyprint JSON.
module ActiveSupport::JSON::Encoding
  class JSONGemEncoder
    def stringify(jsonified)
      JSON.pretty_generate(jsonified, quirks_mode: true, max_nesting: false)
    end
  end
end
