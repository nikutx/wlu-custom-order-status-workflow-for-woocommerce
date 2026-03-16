=== WLU Custom Order Status for WooCommerce ===
Contributors: weblevelup
Tags: woocommerce, order status, custom order status, woocommerce workflow, email automation
Requires at least: 6.0
Tested up to: 6.9
WC requires at least: 8.0
WC tested up to: 10.6
Requires PHP: 7.4
Stable tag: 1.0.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Create custom WooCommerce order statuses, automate email notifications, and streamline your fulfillment workflow.

== Description ==

Are the default WooCommerce order statuses ("Processing", "Completed", "On Hold") not enough for your unique fulfillment process?
**WLU Custom Order Status for WooCommerce** allows you to build a tailor-made order management system.

Easily create new custom order statuses, inject beautiful status colors into your WooCommerce admin, and set up automated workflow rules to trigger emails when an order changes status. Stop manually emailing customers at every step of your fulfillment process. Automate it!

### 🚀 Core Features:
* **Create Custom Statuses:** Add brand new custom order statuses tailored to your exact workflow (e.g., "Awaiting Shipment", "Manufacturing", "Ready for Pickup").
* **Workflow Automation (Rules):** Automatically send beautifully formatted emails to customers or admins when an order hits a specific status.
* **Admin Color Injection:** Assign custom colors to your statuses. These colors inject directly into the standard WooCommerce Orders list, making it easy to see your fulfillment pipeline at a glance.
* **Customer Dashboard Pills:** Display your custom colored status "pills" directly on the frontend in the customer's "My Account > Orders" table.
* **Edit Core Statuses:** Safely override the colors and settings of default WooCommerce statuses.

### ⚡ Unlock Advanced Capabilities with WLU Pro:
Ready to scale your store operations?
Upgrading to **[WLU Workflow Pro](https://weblevelup.co.uk/plugins/custom-order-status-workflow-for-woocommerce/)** unlocks:
* **Advanced Activity Logs:** Stop guessing. Get a complete, real-time audit trail of every rule fired, every email sent, and every order affected.
* **Conditional Logic & Routing:** Send notifications to specific vendors, warehouses, or staff based on order contents.
* **Premium Developer Support:** Get priority assistance directly from your WordPress dashboard via our built-in ticketing system.

[Get WLU Workflow Pro Today!](https://weblevelup.co.uk/plugins/custom-order-status-workflow-for-woocommerce/)

== Installation ==

1. Go to **Plugins > Add New** in your WordPress dashboard.
2. Search for "WLU Custom Order Status".
3. Click **Install Now** and then **Activate**.
4. Navigate to **WooCommerce > Custom Statuses** in your admin menu to start building your workflows!

== Frequently Asked Questions ==

= Does this plugin work with High-Performance Order Storage (HPOS)? =
Yes! The plugin is fully optimized and natively supports WooCommerce's High-Performance Order Storage (HPOS) for maximum speed and database efficiency.

= Will my custom statuses show up in the WooCommerce analytics? =
Yes, custom statuses created with this plugin integrate seamlessly into your WooCommerce ecosystem.

= What happens if I uninstall the plugin? =
By default, your statuses are kept safe in your database. If you want to completely wipe all custom statuses and rules upon deletion, you can enable "Uninstall Cleanup" in the plugin settings.

== Screenshots ==

1. The beautiful React-powered Custom Status manager.
2. Building an automated email workflow rule.
3. Custom colored status pills in the WooCommerce Orders list.
4. Plugin Settings and Pro License connection.

== Changelog ==

= 1.0.2 =
* Security: Enhanced output escaping for admin and frontend custom status badges.
* Performance: Implemented WordPress Object Caching on database queries to optimize load times.
* Under the hood: Refactored database queries and file handling to strictly comply with WordPress Coding Standards (WPCS).

= 1.0.1 =
* Initial public release! Custom statuses, workflow rules, and color injection.