# frozen_string_literal: true
class MoneyAmountInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)

    actual_field = @builder.hidden_field(attribute_name)
    input_id = attribute_name.to_s + "_input_field"

    # On page load, inputs with this class get their mask setup
    merged_input_options[:class] << "wca-currency-mask"

    amount_input = template.content_tag(:input, "",
                                        value: @builder.object.send(attribute_name),
                                        id: input_id,
                                        type: "text",
                                        'data-target': "##{@builder.object_name}_#{attribute_name}",
                                        'data-currency': currency,
                                        class: merged_input_options[:class])
    actual_field + amount_input
  end

  def currency
    @currency ||= options.delete(:currency) || Money.default_currency.iso_code
  end
end
