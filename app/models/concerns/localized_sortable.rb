# frozen_string_literal: true

# Appends a bunch of methods to *Cachable* classes to expose
# a collection of sorted objects based on the user's locale.
require 'active_support/concern'

module LocalizedSortable
  extend ActiveSupport::Concern

  def name
    I18n.t(read_attribute(self.class::NAME_LOOKUP_ATTRIBUTE), scope: self.class.name.underscore.pluralize)
  end

  def name_in(locale)
    I18n.t(read_attribute(self.class::NAME_LOOKUP_ATTRIBUTE), scope: self.class.name.underscore.pluralize, locale: locale)
  end

  def real?
    !self.class::FICTIVE_IDS.include?(id)
  end

  included do
    scope :uncached_real, -> { where.not(id: fictive_ids) }

    # Relevant comments about `thread_mattr_accessor` vs. `mattr_accessor` and about hooks
    #   can all be found in the code for the `cachable.rb` module.
    mattr_accessor :real_objects, :all_sorted_by_locale

    # No filter for `:create` or `:update` because we cannot access individual entities here
    #   so we just flush the whole cache whenever any update happens
    after_commit :clear_localized_cache

    def clear_localized_cache
      self.real_objects = nil
      self.all_sorted_by_locale = nil
    end
  end

  class_methods do
    def fictive_ids
      self::FICTIVE_IDS
    end

    def real
      self.real_objects ||= self.uncached_real
    end

    def all_sorted_by(locale, real: false)
      self.all_sorted_by_locale ||= I18n.available_locales.index_with do |available_locale|
        I18nUtils.localized_sort_by!(available_locale, self.c_values) { |object| object.name_in(available_locale) }
      end.freeze

      real ? self.all_sorted_by_locale[locale].select(&:real?) : self.all_sorted_by_locale[locale]
    end
  end
end
