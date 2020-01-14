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
    "key": "6dda738f-d6ae-4160-ae22-650ada5e1a08",  // a uuid generated as the primary key for this registration monitoring entry
    "created": "2020-01-01T00:00:00+00:00",         // when the entry was added (used by popup.js to sort the added registrations)
    "state": "TX",                                  // the state for is entry (used by background.js to import the checker script)
    "status": "valid|error|needs-attention|empty",  // the current status of the entry (used to determine the browser toolbar icon)
    "popupEntry": "...",                            // the current status in html (included in popup.html)
    "stateStorage": {...},                          // state-specific storage for voter details and logs
}
```

## How to write a new state
* Create a `states/{state}/add_registration.js` script adds a `PurgeAlert.{state}.insertRegistrationForm()` when loaded, so it can be called when a user selects that state from the dropdown.
  * When inserted, you probably want to include `onsubmit=...` functionality that runs logic you also inject when `insertRegistrationForm()` is called, so that you can save new entries to storage.
  * You probably want to run your state's `checkRegistration(entry, callback)` with an entry where `"key": null` before saving to storage so you can let the user fix typos before closing the window.
  * When you've successfully saved a new registration entry and want to close the `add_registration.html` interface, send a message to the the parent `popup.html` via `opener.postMessage("close");` and it will close the `add_registration.html` window and reload the `popup.html` interface.
* Create a `states/{state}/check_registration.js` script adds a `PurgeAlert.{state}.checkRegistration(entry, callback)` when loaded, so it can be called by `background.js` to check the voter's registration for that entry.
  * When called, this function is responsible for updating the `status`, `popupEntry` fields in the `entry` object and saving those updates to storage for that `key`.
  * `status` for each entry is bubbled up to the browser toolbar icon in an override hierarchy (`error > needs-attention > valid > empty`), where if any entry is one of the higher level, the browser toolbar icon is that level (e.g. if any entry is `error` the overall browser toolbar icon will be the `error` icon).
  * You are encouraged to update the `entry` object in storage as you go (e.g. to give status updates in `popupEntry` as your checker runs), and `background.js` will detect these changes (via `storage.onChanged`) and automatically update the browser toolbar icon and `popup.html` (if needed).
  * It is up to you to rate limit and determine what you want to include in the `popupEntry` html (usually it's some summary info about the voter's registration, the last check result, links to view logs, etc.).
* Create additional pages and functionality that are linked to from html in the `insertRegistrationForm()` and `popupEntry`.
  * These are typically things like fixing lookup errors, viewing checking history, solving captchas, etc.

