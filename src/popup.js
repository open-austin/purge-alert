console.log("popup.js run!");

document.querySelector("#add-registration").addEventListener("click", function(e){
    console.log("click!", e);
    e.preventDefault();
    window.open("add_registration.html", "purge-alert", "width=500,height=300,dependent,menubar=no,toolbar=no,personalbar=no");
});

