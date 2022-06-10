# frozen_string_literal: true

class MoneyAmountInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    # Here is some explanation about how generating the input works (to save people
    # some digging in SimpleForm's source code):
    # This method should return a string with the html code generating the input.
    # The base class includes a ton of helpers to generates html tag and other
    # predefined inputs.
    # In this class the input consists of one visible input (with the money mask),
    # and one hidden input, containing the actual value sent to the controller.
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)

    # Get the value specified by the user if any, otherwise try to get the current
    # value from the model this input is for.
    value = options.delete(:value) || @builder.object.send(attribute_name)

    # Get the id of the currency selector's selector
    currency_selector = options.delete(:currency_selector)

    # This will create the hidden input tag, using SimpleForm's predefined helper
    actual_field = @builder.hidden_field(attribute_name, value: value)
    input_id = attribute_name.to_s + "_input_field"

    # On page load, inputs with this class get their mask setup
    merged_input_options[:class] << "wca-currency-mask"

    # This helper create an arbitrary tag (in this case an input), with the given attributes.
    amount_input = template.content_tag(:input, "",
                                        value: value,
                                        id: input_id,
                                        type: "text",
                                        data: {
                                          target: "##{@builder.object_name}_#{attribute_name}",
                                          currency: currency,
                                          'currency-selector': currency_selector,
                                        },
                                        class: merged_input_options[:class],
                                        disabled: options[:disabled])
    actual_field + amount_input
  end

  def currency
    @currency ||= options.delete(:currency) || Money.default_currency.iso_code
  end
end
