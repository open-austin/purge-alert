// language translations
document.querySelector("#confirm-remove").innerText = browser.i18n.getMessage("removeConfirmQuestion");
document.querySelector("#remove-button").innerText = browser.i18n.getMessage("removeConfirmSubmit");
document.querySelector("#dont-remove").innerText = browser.i18n.getMessage("removeConfirmCancel");

// listen for entry removal confirmation
document.querySelector("#remove-button").addEventListener("click", function(e){
    e.preventDefault();

    // show pending state
    document.querySelector("#remove-button").innerText = browser.i18n.getMessage("removeConfirmWaiting");
    document.querySelector("#remove-button").setAttribute("disabled", "");

    // call the state's remove entry
    var entryId = (new URL(window.location.href)).searchParams.get("entry");
    PurgeAlert['TX']['removeEntry'](entryId, function(){
        browser.windows.getCurrent().then(function(w){
            browser.windows.remove(w.id);
        });
    });
});

// don't remove the entry
document.querySelector("#dont-remove").addEventListener("click", function(e){
    e.preventDefault();
    browser.windows.getCurrent().then(function(w){
        browser.windows.remove(w.id);
    });
});
