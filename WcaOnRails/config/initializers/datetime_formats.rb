# frozen_string_literal: true

# See http://gavinmorrice.com/posts/3-keeping-your-dates-and-times-dry-with-to_formatted_s
[Time, Date].map do |klass|
  klass::DATE_FORMATS[:long_utc] = lambda { |t| t.strftime("#{t.to_fs(:long)} %Z") }
end
