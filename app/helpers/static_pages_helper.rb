# frozen_string_literal: true

module StaticPagesHelper
  def wca_icon
    image_tag "WCA Logo.svg", class: "wca-tool-icon", data: {
      toggle: "tooltip",
      placement: "right",
      title: t("score_tools.wca_icon_text"),
    }
  end
end
