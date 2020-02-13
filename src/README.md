# Technical Documentation
This readme covers the technical details of how this browser extension
is organized so that contributers can maintain and extend coverage for
more states.

## How this extension is organized
This project is designed to be extended to add support for many states,
so it is organized into "overall files" which are not state-specific, and
"state files" which are custom to each state. Additionally, added
registration entries are stored in a specific json format using the
[Storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage).

### Overall files:
* `manifest.json` - The config file for the browser extension itself
* `popup.html` + `popup.js` - The dropdown when you click the icon in your browser toolbar
* `background.js` - Manages running checker scripts for the.
* `add_registration.html` - The starting point to add a registration to monitor
* `assets/*` - Static files and libraries that can be used by overall or state files
* `_locales/{lang}/messages.json` - Translations that can be used by overall or state files

### State files:
* `states/{state}/add_registration.js` - What gets imported when a user selects that state in the `add_registration.html` interface. When loaded, this is expected to add a `browser.PurgeAlert.{state}.insertRegistrationForm()` function inserts the form fields needed to lookup the user's voter registration, then validates and saves the submitted lookup fields as a new registration.
* `states/{state}/check_registration.js` - What gets used by `background.js` to check a voter's registration. When loaded, this is expected to add a `browser.PurgeAlert.{state}.checkRegistration(entry, callback)` function that can be called when the checker runs on a regular basis. NOTE: The generic checker script runs very frequently (multiple times per day), so you probably need to rate limit your state-specific logic internally to prevent making excessive requests to that state's source page.
* `states/{state}/*` - Anything else that's reference by `add_registration.js` or `check_registration.js` for state-specific functionality (edit registration pages, viewing error history, etc.). Since each entry's `popupEntry` is raw html for including in `popup.html`, you can link to whatever additional pages or functionality you like for a state. We'd prefer to not have cross-state links, so it's okay to copy code from one state folder to another or to add a resource to `assets/*` that can be used by multiple states.

### Storage Entries
```
{
    "key": "6dda738f-d6ae-4160-ae22-650ada5e1a08",          // a uuid generated as the primary key for this registration monitoring entry
    "created": "2020-01-01T00:00:00+00:00",                 // when the entry was added (used by popup.js to sort the added registrations)
    "status": "valid|error|needs-attention|empty|pending",  // the current status of the entry (used to determine the browser toolbar icon)
    "popupEntry": "...",                                    // the current status in html (included in popup.html)
    "state": "TX",                                          // the state for is entry (used by background.js to import the checker script)
    "stateStorage": {...},                                  // state-specific storage for voter details and logs
}
```

## How to write a new state
* Create a `states/{state}/state.js` script that adds two `PurgeAlert.{state}.{functions}` when loaded:
  * `PurgeAlert.{state}.insertRegistrationForm()` - what's called when a user selects that state from the dropdown in the `add_registration.html` interface.
  * `PurgeAlert.{state}.checkRegistration(entry, canAskForUrlPermission, callback)` - what's called when both adding a new registration and by `background.js` when periodically checking the status of a voter registration.
    * When called, this function is responsible for updating the `status`, `popupEntry` fields in the `entry` object and saving those updates to storage for that `key`.
    * `entry` is the object using the [Entry](#storage-entries) object format (can have `"key": null` if a mocked entry from `add_registration.html` before saving to storage).
    * `canAskForUrlPermission` is a boolean for whether the user can be asked for additional domain access permissions (this is usually `true` when called from `add_registration.html` and `false` when called from `background.js`).
    * `callback(entry)` is called with the updated entry when checking is done or errored (errors should be stored in the entry itself).
    * `status` for each entry is bubbled up to the browser toolbar icon in an override hierarchy (`error > needs-attention > valid > empty`), where if any entry is one of the higher level, the browser toolbar icon is that level (e.g. if any entry is `error` the overall browser toolbar icon will be the `error` icon).
    * You are encouraged to update the `entry` object in storage as you go (e.g. to give status updates in `popupEntry` as your checker runs), and `background.js` will detect these changes (via `storage.onChanged`) and automatically update the browser toolbar icon and `popup.html` (if needed).
    * It is up to you to rate limit and determine what you want to include in the `popupEntry` html (usually it's some summary info about the voter's registration, the last check result, links to view logs, etc.).
* Create additional pages and functionality that are linked to from html in the `insertRegistrationForm()` and `popupEntry`.
  * These are typically things like fixing lookup errors, viewing checking history, solving captchas, etc.

