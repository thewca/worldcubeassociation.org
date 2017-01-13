# frozen_string_literal: true
module ServerStatusHelper
  def css_classes(missing_keys_empty, outdated_keys_empty)
    if missing_keys_empty && outdated_keys_empty
      class_heading = ""
      class_panel = class_missing = class_outdated = "success"
      title = "All good, the translation is up to date!"
    elsif missing_keys_empty && !outdated_keys_empty
      class_heading = "heading-as-link"
      class_missing = "success"
      class_panel = class_outdated = "warning"
      title = "Some items in the translation are outdated"
    elsif outdated_keys_empty && !missing_keys_empty
      class_heading = "heading-as-link"
      class_panel = "warning"
      class_missing = "danger"
      class_outdated = "success"
      title = "Some items in the translation are missing"
    else
      # The only other choice is that both lists are not empty
      class_heading = "heading-as-link"
      class_panel = class_outdated = "warning"
      class_missing = "danger"
      title = "Some items in the translation are missing and some others are outdated"
    end
    [class_heading, class_panel, class_missing, class_outdated, title]
  end
end
