# Monkeypatch ActiveSupport's JSON encoder to prettyprint JSON.
module ActiveSupport::JSON::Encoding
  class JSONGemEncoder
    def stringify(jsonified)
      JSON.pretty_generate(jsonified)
    end
  end
end
