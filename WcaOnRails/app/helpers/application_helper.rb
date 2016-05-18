module ApplicationHelper
  def full_title(page_title='')
    base_title = WcaOnRails::Application.config.site_name
    if page_title.empty?
      base_title
    else
      page_title + " | " + base_title
    end
  end

  def bootstrap_class_for(flash_type)
    {
      success: "alert-success",
      danger: "alert-danger",
      warning: "alert-warning",
      info: "alert-info",

      # For devise
      notice: "alert-success",
      alert: "alert-danger",

      recaptcha_error: "alert-danger",
    }[flash_type.to_sym] || flash_type.to_s
  end

  def link_to_google_maps_place(text, latitude, longitude)
    url = "https://www.google.com/maps/place/#{latitude},#{longitude}"
    link_to text, url, target: "_blank"
  end

  def link_to_google_maps_dir(text, start_latitude, start_longitude, end_latitude, end_longitude)
    url = "https://www.google.com/maps/dir/#{start_latitude},#{start_longitude}/#{end_latitude},#{end_longitude}/"
    link_to text, url, target: "_blank"
  end

  def mail_to_wca_board
    mail_to "board@worldcubeassociation.org", "Board", target: "_blank"
  end

  def md(content, target_blank: false)
    if content.nil?
      return ""
    end

    options = {
      escape_html: true,
      hard_wrap: true,
    }

    if target_blank
      options[:link_attributes] = { target: "_blank" }
    end

    Redcarpet::Markdown.new(Redcarpet::Render::HTML.new(options)).render(content).html_safe
  end

  def filename_to_url(filename)
    "/" + Pathname.new(File.absolute_path(filename)).relative_path_from(Rails.public_path).to_path
  end

  def anchorable(pretty_text, id=nil)
    id ||= pretty_text.parameterize
    "<span id='#{id}' class='anchorable'><a href='##{id}'><span class='glyphicon glyphicon-link'></span></a> #{pretty_text}</span>".html_safe
  end

  WCA_EXCERPT_RADIUS = 50

  def wca_excerpt(html, phrase)
    text = ActiveSupport::Inflector.transliterate(strip_tags(html)) # TODO https://github.com/cubing/worldcubeassociation.org/issues/238
    excerpted = excerpt(text, phrase, radius: WCA_EXCERPT_RADIUS)
    # If nothing matches the given phrase, just return the beginning.
    if excerpted.blank?
      excerpted = truncate(text, length: WCA_EXCERPT_RADIUS)
    end
    wca_highlight(excerpted, phrase)
  end

  def wca_highlight(html, phrases, do_not_transliterate: false)
    text = if !do_not_transliterate
             ActiveSupport::Inflector.transliterate(strip_tags(html)) # TODO https://github.com/cubing/worldcubeassociation.org/issues/238
           else
             strip_tags(html)
           end
    highlight(text, phrases, highlighter: '<strong>\1</strong>')
  end

  def wca_omni_search
    text_field_tag nil, @omni_query, placeholder: "Search site", class: "form-control wca-autocomplete wca-autocomplete-omni wca-autocomplete-search wca-autocomplete-only_one wca-autocomplete-users_search wca-autocomplete-persons_table"
  end

  def wca_local_time(time)
    local_time(time, "%B %e, %Y %l:%M%P %Z")
  end

  def wca_table(responsive: true, hover: true, striped: true, floatThead: true, table_class: "", data: {})
    table_classes = "table wca-results table-condensed table-greedy-last-column #{table_class}"
    if floatThead
      table_classes += " floatThead"
    end
    if hover
      table_classes += " table-hover"
    end
    if striped
      table_classes += " table-striped"
    end

    content_tag :div, class: (responsive ? "table-responsive" : "") do
      content_tag :table, class: table_classes, data: data do
        yield
      end
    end
  end

  def process_nav_items(nav_items)
    nav_items.each do |nav_item|
      nav_item[:children] = nav_item[:children] || []
      nav_item[:tiny_children] = nav_item[:tiny_children] || []
      process_nav_items(nav_item[:children])
      process_nav_items(nav_item[:tiny_children])
      nav_item[:active] = (nav_item[:is_active] && nav_item[:is_active].call) || (nav_item[:path] && current_page?(nav_item[:path])) || nav_item[:children].any? { |i| i[:active] } || nav_item[:tiny_children].any? { |i| i[:active] }
    end
    nav_items
  end

  def wca_date_range(from_date, to_date, options={})
    if from_date && to_date
      options[:separator] = '-'
      date_range(from_date, to_date, options)
    else
      t "competitions.unscheduled"
    end
  end

  def alert(type, content=nil, note: false, &block)
    content = capture(&block) if block_given?
    if note
      content = content_tag(:strong, "Note:") + " " + content
    end
    content_tag :div, content, class: "alert alert-#{type}"
  end

  def users_to_sentence(users, include_email: false)
    "".html_safe + users.sort_by(&:name).map do |user|
      include_email ? mail_to(user.email, user.name) : user.name
    end.to_sentence
  end
end
