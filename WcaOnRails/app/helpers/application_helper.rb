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

      recaptcha_error: "alert-danger"
    }[flash_type.to_sym] || flash_type.to_s
  end

  def md(content)
    Redcarpet::Markdown.new(Redcarpet::Render::HTML.new).render(content).html_safe
  end

  def filename_to_url(filename)
    "/" + Pathname.new(File.absolute_path(filename)).relative_path_from(Rails.public_path).to_path
  end

  def notifications_for_user(user)
    notifications = []
    user.delegated_competitions.where(isConfirmed: false).each do |unconfirmed_competition|
      notifications << {
        text: "#{unconfirmed_competition.name} is not confirmed",
        url: edit_competition_path(unconfirmed_competition),
      }
    end
    user.organized_competitions.where(isConfirmed: false).each do |unconfirmed_competition|
      notifications << {
        text: "#{unconfirmed_competition.name} is not confirmed",
        url: edit_competition_path(unconfirmed_competition),
      }
    end
    if user.board_member?
      Competition.where(isConfirmed: true, showAtAll: false).each do |competition|
        notifications << {
          text: "#{competition.name} is waiting to be announced",
          url: admin_edit_competition_path(competition),
        }
      end
    end
    notifications
  end
end
