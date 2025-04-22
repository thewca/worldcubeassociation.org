# frozen_string_literal: true

module SelectizeHelper
  def fill_in_selectize(label_or_node, with:)
    if label_or_node.instance_of? Capybara::Node::Element
      selectize_input = label_or_node.find("input")
    else
      label = label_or_node
      label_node = find(:label, text: label, exact_text: true)
      for_id = label_node[:for]
      selectize_input = page.find("div.#{for_id} .selectize-control input")
    end

    selectize_input.send_keys(with)
    # Wait for selectize popup to appear.
    expect(page).to have_css("div.selectize-dropdown", visible: :visible)
    # Select item with selectize.
    selectize_input.send_keys(:enter)
  end
end
