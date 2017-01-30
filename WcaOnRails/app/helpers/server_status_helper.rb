# frozen_string_literal: true
module ServerStatusHelper
  def css_classes(missing_keys_empty, unused_keys_empty, outdated_keys_empty)
    class_missing = missing_keys_empty ? "success" : "danger"
    class_unused = unused_keys_empty ? "success" : "warning"
    class_outdated = outdated_keys_empty ? "success" : "warning"

    all_good = missing_keys_empty && unused_keys_empty && outdated_keys_empty
    class_panel = all_good ? "success" : "warning"
    title = all_good ? "All good" : "Needs attention"
    class_heading = all_good ? "" : "heading-as-link"
    [class_heading, class_panel, class_missing, class_unused, class_outdated, title]
  end
end
