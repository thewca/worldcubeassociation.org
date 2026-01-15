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
        i18n_connectors = I18n.t(:'support.array', locale: options[:locale], default: {})
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
          str << delimiter if i.positive?
          str << element
        end
      end
    end
  end

  Hash.class_eval do
    include TSort

    def merge_serialization_opts(other = nil)
      self.to_h do |key, value|
        # Try to read `key` from the other hash, fall back to empty array.
        other_value = other&.fetch(key.to_s, []) || []

        # Merge arrays together, making sure to respect the difference between symbols and strings.
        merged_value = value.map(&:to_sym) & other_value.map(&:to_sym)

        # Return the merged result associated with the original (common) key
        [key, merged_value]
      end
    end

    # The following enables topological sorting on dependency hashes.
    #   Snippet stolen from https://github.com/ruby/tsort
    alias_method :tsort_each_node, :each_key

    def tsort_each_child(node, &)
      fetch(node).each(&)
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
      @client.application.dangerously_allow_any_redirect_uri ? true : old_validate_redirect_uri.bind_call(self)
    end
  end

  Enumerable.class_eval do
    def stable_sort_by_asc
      sort_by.with_index { |x, idx| [yield(x), idx] }
    end

    # "sort and then reverse" is the usual Ruby hack for achieving DESC sort.
    # But this kills stability when applying to "stable sort and then reverse"
    # so because of the reversing we need to reverse the tie-breaker as well
    def stable_sort_by_desc
      sort_by.with_index { |x, idx| [yield(x), -idx] }.reverse
    end
  end

  Hash.class_eval do
    def reject_values_recursive(&)
      self.transform_values do |value|
        if value.is_a?(Hash)
          value.reject_values_recursive(&)
        else
          value
        end
      end.reject do |_key, value|
        yield value
      end
    end

    def each_recursive(*prefixes, &)
      self.each do |key, value|
        next_prefixes = prefixes + [key]

        if value.is_a?(Hash)
          value.each_recursive(*next_prefixes, &)
        else
          yield key, value, *prefixes
        end
      end
    end
  end

  if Rails.env.test?
    DatabaseCleaner::ActiveRecord::Base.class_eval do
      def self.migration_table_name
        if Gem::Version.new("7.2.0") <= ActiveRecord.version
          ActiveRecord::Base.connection_pool.schema_migration.table_name
        elsif Gem::Version.new("6.0.0") <= ActiveRecord.version
          ActiveRecord::Base.connection.schema_migration.table_name
        else
          ActiveRecord::SchemaMigration.table_name
        end
      end
    end
  end
  # Temporary fix until https://github.com/ruby-shoryuken/shoryuken/pull/777 or
  # https://github.com/rails/rails/pull/53336 is merged
  if Rails.env.production?
    ActiveJob::QueueAdapters::ShoryukenAdapter.class_eval do
      def enqueue_after_transaction_commit?
        true
      end
    end
  end

  # Temporary fix until https://github.com/phlegx/money-currencylayer-bank/pull/20
  # to allow exchanging from a currency to itself
  Money::Bank::CurrencylayerBank.class_eval do
    # 1. Create an alias for the original method so we don't lose it
    alias_method :original_get_rate, :get_rate

    # 2. Redefine get_rate to handle the "same currency" check
    def get_rate(from_currency, to_currency, opts = {})
      # If source and destination are the same, return 1.0
      return 1.0 if from_currency == to_currency

      # Otherwise, call the original method (which calls the API/Cache)
      original_get_rate(from_currency, to_currency, opts)
    end
  end
end
