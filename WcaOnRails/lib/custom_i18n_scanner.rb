require 'i18n/tasks/scanners/file_scanner'
class WCAFileScanner < I18n::Tasks::Scanners::FileScanner
  include I18n::Tasks::Scanners::RelativeKeys
  include I18n::Tasks::Scanners::OccurrenceFromPosition

  def active_record?(model)
    # FIXME: Find a way to determine this dynamically ?
    model != "contact"
  end

  def extract_model_attr(key)
    model = key.gsub(/^(\w+)\..*$/, '\1').singularize
    # Some dirty tricks to assign the detected field to the "correct" model
    if model == "devise"
      model = "user"
    elsif model == "admin"
      model = "person"
    elsif model == "oauth"
      model = "doorkeeper/application"
    end
    attribute = key.gsub(/.*\.(\w+)$/, '\1')
    [model, attribute]
  end

  # @return [Array<[absolute key, Results::Occurrence]>]
  def scan_file(path)
    text = read_file(path)
    keys = []
    retval = []
    # First scan for inputs (or labels for inputs) that are not hidden
    text.scan(/^\s*<%= f.(input|label|input_field) :(\w+)(?!.*hidden)(.*)%>/).map do |match|
      # 'absolute_key' returns something that we assume looks like model.(.*).attribute
      abskey = absolute_key(".#{match.second}", path)
      occurrence = occurrence_from_position(
        path, text, Regexp.last_match.offset(0).first)
      # Store this for further analysis (that involves Regexp),
      # check if a custom 'hint' is provided,
      # check if a custom 'label' is provided
      keys << [abskey, occurrence, match.third.include?("hint:"), match.third.include?("label:")]
    end
    # Then scan for possible radio choices
    text.scan(/^\s*<%= f.input :(\w+), as: :radio_buttons, collection: \[(.*)\](.*)%>/).map do |match|
      abskey = absolute_key(".#{match.first}", path)
      occurrence = occurrence_from_position(
        path, text, Regexp.last_match.offset(0).first)
      model, attribute = extract_model_attr(abskey)
      # Get all choices from the f.input
      options = match.second.gsub(/[: ]/, '').split(',')
      options.each do |o|
        # Mark every choice as used
        retval << ["simple_form.options.#{model}.#{attribute}.#{o}", occurrence]
      end
    end
    keys.each do |k|
      # Doing the gsub in the original scan block messes up with Regexp.last_match
      model, attribute = extract_model_attr(k[0])
      # Mark the hint as used if we don't use custom hint
      if !k[2]
        retval << ["simple_form.hints.#{model}.#{attribute}", k[1]]
      end
      # Skip the last part unless we don't use a custom label
      next unless !k[3]
      # Simple form can fetch its labels from activerecord.attributes,
      # Mark it as used ... Except if the model is not an ActiveRecord ;)
      # if not we mark the label as used!
      retval << if active_record?(model)
                  ["activerecord.attributes.#{model}.#{attribute}", k[1]]
                else
                  ["simple_form.labels.#{model}.#{attribute}", k[1]]
                end
    end
    retval
  end
end

::I18n::Tasks.add_scanner 'WCAFileScanner', only: %w(*.erb)
