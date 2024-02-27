# frozen_string_literal: true

class AddWorldsMerchAnnouncement < ActiveRecord::Migration[7.0]
  def change
    # March 3rd, 2023
    shop_launch = Date.strptime("03-03-2023", "%d-%m-%Y")

    Starburst::Announcement.create(
      body: 'New WCA Merch! Visit the <a href="https://shop.worldcubeassociation.org/">WCA store</a> to see new Worlds 2023 apparel, WCA accessories and more! Go to <a href="https://shop.worldcubeassociation.org/">shop.worldcubeassociation.org</a>',
      start_delivering_at: shop_launch,
      stop_delivering_at: shop_launch.advance(days: 30),
    )
  end
end
