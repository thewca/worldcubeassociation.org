# Hook into rails auto reload mechanism.
#  http://stackoverflow.com/a/7670266/1739415
Rails.configuration.to_prepare do
  # Date.safe_parse
  # http://stackoverflow.com/a/21034652/1739415
  Date.class_eval do
    def self.safe_parse(value, default = nil)
      Date.strptime(value.to_s, '%Y-%m-%d')
    rescue ArgumentError
      default
    end
  end
end
