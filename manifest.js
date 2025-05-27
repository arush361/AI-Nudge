{
  "manifest_version": 3,
  "name": "AI Task Nudge",
  "version": "1.0",
  "description": "Gentle reminders to consider AI assistance for your tasks",
  "permissions": [
    "tabs",
    "activeTab",
    "scripting",
    "storage",
    "notifications"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content_script.js"],
      "css": ["styles.css"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "AI Task Nudge Settings"
  },
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "matches": ["<all_urls>"],
      "resources": ["ai_sidebar.html"]
    }
  ]
}