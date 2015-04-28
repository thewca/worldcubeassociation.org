class ContactsController < ApplicationController
  def wrc
    @contact = Contact.new
  end

  def wrc_create
    @contact = Contact.new(params[:contact])
    @contact.request = request
    @contact.to_email = "wrc@worldcubeassociation.org"
    @contact.subject = "WRC Contact Form"
    if @contact.valid? && @contact.deliver
      flash[:success] = 'Thank you for your message. We will contact you soon!'
      redirect_to contact_wrc_url
    else
      flash.now[:danger] = 'Could not send message.'
      render :wrc
    end
  end

  def website
    @contact = Contact.new
  end

  def website_create
    @contact = Contact.new(params[:contact])
    @contact.request = request
    @contact.to_email = "contact@worldcubeassociation.org"
    @contact.subject = "WCA Website Comments"
    if @contact.valid? && @contact.deliver
      flash[:success] = 'Thank you for your message. We will contact you soon!'
      redirect_to contact_website_url
    else
      flash.now[:danger] = 'Could not send message.'
      render :wca
    end
  end
end
