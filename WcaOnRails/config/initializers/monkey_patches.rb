# frozen_string_literal: true

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

  Array.class_eval do
    def xss_aware_to_sentence(options = {})
      options.assert_valid_keys(:words_connector, :two_words_connector, :last_word_connector, :locale)

      default_connectors = {
        words_connector: ', ',
        two_words_connector: ' and ',
        last_word_connector: ', and ',
      }
      if defined?(I18n)
        i18n_connectors = I18n.translate(:'support.array', locale: options[:locale], default: {})
        default_connectors.merge!(i18n_connectors)
      end
      options = default_connectors.merge!(options)

      case length
      when 0
        ''
      when 1
        self[0].to_s.dup
      when 2
        self[0] + options[:two_words_connector] + self[1]
      else
        self[0...-1].xss_aware_join(options[:words_connector]) + options[:last_word_connector] + self[-1]
      end
    end

    # Copied from http://makandracards.com/makandra/954-don-t-mix-array-join-and-string-html_safe
    def xss_aware_join(delimiter = '')
      ''.html_safe.tap do |str|
        each_with_index do |element, i|
          str << delimiter if i > 0
          str << element
        end
      end
    end
  end

  ActiveSupport::Duration.class_eval do
    def in_seconds
      self.to_i
    end

    def in_centiseconds
      self.in_seconds * 100
    end
  end

  ActiveRecord::Associations::CollectionProxy.class_eval do
    def destroy_all!
      self.each(&:destroy!)
      self.reload
    end
  end

  # Copied and modified from https://github.com/doorkeeper-gem/doorkeeper/issues/210#issuecomment-15895378
  Doorkeeper::OAuth::PreAuthorization.class_eval do
    old_validate_redirect_uri = instance_method(:validate_redirect_uri)
    define_method(:validate_redirect_uri) do
      @client.application.dangerously_allow_any_redirect_uri ? true : old_validate_redirect_uri.bind(self).call
    end
  end
end

module Enumerable
  def stable_sort_by
    sort_by.with_index { |x, idx| [yield(x), idx] }
  end
end
