# frozen_string_literal: true

module AutonumericHelper
  def fill_in_autonumeric(selector, with:)
    autonumeric_input = find(selector)

    # Playwright usually fills elements by just "magically setting" the text directly.
    # But AutoNumeric specifically requires you to type out the text one-by-one,
    #   so that the corresponding update events fire.
    autonumeric_input.with_playwright_element_handle { it.select_text }
    autonumeric_input.send_keys(with)
  end
end
