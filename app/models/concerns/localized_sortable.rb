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

    thread_mattr_accessor :real_objects, :all_sorted_by_locale, instance_accessor: false
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
        I18nUtils.localized_sort_by!(available_locale, self.c_all_by_id.values) { |object| object.name_in(available_locale) }
      end.freeze
      real ? self.all_sorted_by_locale[locale].select(&:real?) : self.all_sorted_by_locale[locale]
    end
  end
end
