=== Custom Order Status & Workflow Automation for WooCommerce ===
Contributors: weblevelup
Tags: woocommerce, order status, custom status, workflow, automation
Requires at least: 6.2
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Create custom order statuses, automate email notifications, and streamline your fulfillment workflow. Complete order management for WooCommerce.

== Description ==

Are you struggling to manage orders with just the default WooCommerce statuses?

**WLU Custom Order Status & Workflow Automation** gives you full control over your order lifecycle. Create custom statuses (like 'Awaiting Shipment', 'In Production', or 'Dispatched'), assign custom icons/colors, and trigger automated emails—all from a simple, beautiful interface.

Unlike other plugins that just add a text label, WLU fully integrates your new statuses into the WooCommerce ecosystem, including Admin Reports, Order Filters, and the Customer "My Account" area.

### 🔥 Key Features

* **Custom Statuses:** Create statuses that actually fit your specific business workflow.
* **Visual Customization:** Assign **custom colors** and icons to statuses for instant identification in the Admin Dashboard.
* **Automated Emails:** Trigger custom emails when an order status changes (e.g., automatically send "Shipping Instructions" when status becomes "In Production").
* **Frontend Integration:** Display beautiful, color-coded status badges on the customer's "My Account" page (replaces generic text).
* **Workflow Automation:** Automatically change statuses based on rules (Pro feature teaser).
* **Developer Friendly:** Clean code, highly extendable hooks, and HPOS (High-Performance Order Storage) compatible.

### 🏆 Free vs Pro

| Feature | Free Version | Pro Version |
| :--- | :---: | :---: |
| Custom Statuses | Up to 2 | **Unlimited** |
| Admin Color Injection | ✅ | ✅ |
| Frontend Status Badges | ✅ | ✅ |
| Custom Email Triggers | Basic | **Advanced** |
| SMS Notifications | ❌ | ✅ |
| Audit Logs | ❌ | ✅ |

> **Need unlimited workflows and SMS alerts?**
> [Upgrade to Pro](https://weblevelup.co.uk/plugins/custom-order-status-workflow/) to unlock the full power of automation.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/wlu-custom-order-status-workflow` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Go to **WooCommerce > Custom Statuses** to start creating your first status.

== Frequently Asked Questions ==

= Can I customize the email content? =
Yes! When you create a custom status, you can choose to trigger a standard WooCommerce email. For fully custom HTML templates per status, please check out the Pro version.

= Does this work with High-Performance Order Storage (HPOS)? =
Yes, this plugin is built from the ground up to be fully compatible with WooCommerce HPOS.

= Will my custom statuses disappear if I uninstall the plugin? =
By default, we keep your data safe. You can enable "Clean on Uninstall" in the settings if you want to completely wipe all data when removing the plugin.

== Screenshots ==

1. **Status Editor:** Our modern, React-powered interface makes adding new statuses and assigning colors effortless.
2. **Workflow Rules:** Set up automation rules to trigger emails or change statuses automatically.
3. **Admin Order List:** Instantly spot order progress with beautiful, high-contrast colored badges in your dashboard.
4. **Frontend View:** Give customers a professional experience with matching status badges in their "My Account" order history.

== Changelog ==

= 1.0.1 =
* New: Added Frontend Color Injection for "My Account" pages.
* Fix: Improved compatibility with Twenty Twenty-Five theme.
* Update: Refactored status limit logic for better extensibility.

= 1.0.0 =
* Initial release.