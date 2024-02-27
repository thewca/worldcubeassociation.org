# frozen_string_literal: true

module SelectizeHelper
  def fill_in_selectize(label_or_node, with:)
    if label_or_node.instance_of? Capybara::Node::Element
      selectize_input = label_or_node
    else
      label = label_or_node
      label_node = find(:label, text: label, exact_text: true)
      for_id = label_node[:for]
      selectize_input = page.find("div.#{for_id} .selectize-control input")
    end

    selectize_input.native.send_key(with)
    # Wait for selectize popup to appear.
    expect(page).to have_selector("div.selectize-dropdown", visible: true)
    # Select item with selectize.
    selectize_input.native.send_key(:enter)
  end
end
