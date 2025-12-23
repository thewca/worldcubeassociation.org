# frozen_string_literal: true

class RunAllSanityChecks < WcaCronjob
  def perform
    SanityCheckCategory.all.each do |sanity_check_category|
      SanityCheckCategoryJob.perform_later({ name: sanity_check_category.name.gsub(/\s+/, "").underscore,
                                             category_id: sanity_check_category.id })
    end
  end
end
