# frozen_string_literal: true

class AddMarketingShopAnnouncement < ActiveRecord::Migration[6.0]
  def change
    # November 1st, 2021
    shop_launch = Date.strptime("01-11-2021", "%d-%m-%Y")

    Starburst::Announcement.create(
      body: 'Exclusive WCA Merchandise has launched. Use coupon LAUNCHWEEK for 10% off. Click <a href="https://shop.worldcubeassociation.org/">here</a> to shop.',
      start_delivering_at: shop_launch,
      stop_delivering_at: shop_launch.advance(days: 7),
    )
  end
end
