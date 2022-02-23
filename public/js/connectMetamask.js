
function connectMetamask(e) { 
    if (window.ethereum) {
            ethereum.request({method: "eth_requestAccounts"}).then(function(accounts) {
                changePlayerAccount(accounts[0]);
            });
        }
}

document.addEventListener('DOMContentLoaded', function() {
    connectMetamask();
});
