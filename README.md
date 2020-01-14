# Purge Alert - Monitor your voter registration

**NOTE: THIS PROJECT IS UNDER DEVELOPMENT. THE BROWSER EXTENSION DOES NOT WORK YET.**

Download the browser extension:
* Purge Alert for Firefox (link TBD)
* Purge Alert for Chrome (link TBD)

## What is Purge Alert?
Purge Alert is a browser extension that allows you to monitor your voter
registration status and will alert you if you are purged from the rolls.

## Current Status
* [ ] Prototype - Write a Firefox extension that just supports Texas
* [ ] Multiple Browsers - Add support for Chrome and possibly other browsers
* [ ] Multiple States - Add support beyond Texas
* [ ] Website - Create a website design/logo homepage
* [ ] Marketplaces - List the extension in browser extension stores (Firefox, Chrome, etc.)

## How to use
1. Download and install the Purge Alert extension for your browser (links above).
2. Click the new icon in your browser toolbar to show the dropdown menu.
3. Add you current voter registration information for your state.
4. Purge Alert will start monitoring that registration on a regular basis.
    * A green icon - we found your voter registration at the last check
    * A red icon - we can no longer find your voter registration
    * A yellow icon - we ran into an issue and need your input to fix it

## Why did you make this?
Many states
[have previously](https://www.npr.org/2018/10/22/659591998/6-takeaways-from-georgias-use-it-or-lose-it-voter-purge-investigation)
or are 
[currently considering](https://apnews.com/089c3b1fcb7e4a6e995807ce5b8171c0)
purging thousands of registered voters using tactics that have high
volumes of false positives. We want to let people monitor

## Why not use Vote.org or your state's voter lookup website?
Both [Vote.org](https://www.vote.org/am-i-registered-to-vote/)
and using your state's voter registration lookup website is only
a one-time check. Purge Alert instead lets you add your voter
registration and then continuously monitor it over time for changes.

Additionally, Vote.org's registration lookup tool automatically signs
you up to receive emails from them and shares your request with
third parties, creating privacy concerns.

Since Purge Alert is a browser extension, your voter registration being
monitored stays on your browser and is not shared, logged, or tracked
by any third party, including us. The lookup requests only go directly
to your state or local voter lookup tool, so you never have to worry
about your privacy being violated.

## Who makes Purge Alert?
This project is maintained by volunteers at [Open Austin](https://www.open-austin.org),
a [Code for America](https://www.codeforamerica.org/) brigade.

## License
This is an open-source project released under the [MIT](LICENSE) license.

## Contributing
This is a very simple voter registration monitoring tool, and we want to keep
the scope of the project limited to just that use case. Having said that, if
you want to help out, we'd love the additional support!

Here's some things we *are* interested in:

* Fixing bugs/issues with existing states and counties
* Expanding coverage to support more states and counties
* Code cleanup and organization
* UI/UX improvements for the extension and website

Here's some things we are *not* interested in:

* Tracking or logging user behavior
* Adding new features beyond monitoring voter registrations
* Adding significant bloat (via large frameworks, dependencies, etc.)
* Partnerships that entail providing user statistics

