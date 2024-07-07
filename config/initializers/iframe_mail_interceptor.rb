# frozen_string_literal: true

class IframeMailInterceptor
  class << self
    def delivering_email(message)
      html_part = message.html_part || message
      # Replace iframes with corresponding links.
      html_part.body = html_part.body.decoded.to_str.gsub(%r{<iframe.*?src=['"](.*?)['"].*?</iframe>}) do
        # Handle YT and GMaps differently by converting embedded URLs into normal ones.
        url = $1.gsub(%r{(?<=www.youtube.com/)embed/}, 'watch?v=')
                .gsub(%r{(?<=www.google.com/maps/)embed/v1/place\?key=.*?q=}, 'search/')
        "<a href=\"#{url}\">#{url}</a>"
      end
    end

    alias_method :previewing_email, :delivering_email
  end
end

ActionMailer::Base.register_interceptor(IframeMailInterceptor)
ActionMailer::Base.register_preview_interceptor(IframeMailInterceptor)
