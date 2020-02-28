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
* `background.js` - Manages running checker scripts for stored voter registration entries
* `add_registration.html` + `add_registration.js` - The starting point to add a registration to monitor
* `assets/common.js` - Basic
* `assets/*` - Static files and libraries that can be used by overall or state files
* `_locales/{lang}/messages.json` - Translations that can be used by overall or state files

### State files:
* `states/{state}/state.js` - The state's main logic. When loaded, it must add an object to the `window.PurgeAlert` global object so that the public API can be called via `window.PurgeAlert.{state}.{function_name}()`. The required public functions that a state's object must have:
  * `insertRegistrationForm()` - Called when a user selects that state from the dropdown in the `add_registration.html` interface.
    * Arguments:
      * *no arguments*
  * `renderPopupEntry(entry)` - Called when loading the entries list to show the user when they click the browser action icon.
    * Arguments:
      * `entry` is the object using the [Entry](#storage-entries) object format (can have `"key": null` if a mocked entry from `add_registration.html` before saving to storage).
  * `checkRegistration(entry, canAskForUrlPermission, callback)` - What's called when both adding a new registration in `add_registration.html` and by `background.js` when periodically checking the status of a voter registration. Responsible for updating the `status` field in the `entry` object and saving those updates to storage for that `key`.
    * Arguments:
      * `entry` is the object using the [Entry](#storage-entries) object format (can have `"key": null` if a mocked entry from `add_registration.html` before saving to storage).
      * `canAskForUrlPermission` is a boolean for whether the user can be asked for additional domain access permissions (this is usually `true` when called from `add_registration.html` and `false` when called from `background.js`).
      * `callback(entry)` is called with the updated entry when checking is done or errored (errors should be stored in the entry itself).
    * Notes:
      * You are encouraged to update the `entry` object in storage as you go, so `background.js` can detect these changes (via `storage.onChanged`) and automatically update the browser toolbar icon and `popup.html` (if needed).
      * `background.js` script calls this function frequently (multiple times per day), so you probably need to rate limit your state-specific logic internally to prevent making excessive requests to that state's source page.
* `states/{state}/*` - Anything else that's reference by `state.js` for state-specific functionality (edit registration pages, viewing error history, etc.). Since `popup.html` inserts raw html from a state's `renderPopupEntry(entry)`, you can link to whatever additional pages or functionality you like for a state. We'd prefer to not have cross-state links, so it's okay to copy code from one state folder to another or to add a resource to `assets/*` that can be used by multiple states.

### Storage Entries
```
{
    "key": "6dda738f-d6ae-4160-ae22-650ada5e1a08",          // a uuid generated as the primary key for this registration monitoring entry
    "created": "2020-01-01T00:00:00+00:00",                 // when the entry was added (used by popup.js to sort the added registrations)
    "status": "valid|error|needs-attention|empty|pending",  // the current status of the entry (used to determine the browser toolbar icon)
    "state": "TX",                                          // the state for is entry (used by background.js to import the checker script)
    "stateStorage": {...},                                  // state-specific storage for voter details and logs
}
```

## How to write a new state
* Create a `states/{state}/state.js` script that adds `PurgeAlert.{state}` with the required functions when loaded (see above in "State files" for what's required).
* Create additional pages and functionality that are linked to from html in the `insertRegistrationForm()` and `renderPopupEntry(entry)`.
  * These are typically things like fixing lookup errors, viewing checking history, solving captchas, etc.

