const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

let db;

const request = indexedDB.open('budgetTracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('newBudget', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['newBudget'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('newBudget');

    budgetObjectStore.add(record);
};

function uploadBudget() {
    const transaction = db.transaction(['newBudget'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('newBudget');
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(() => {
                const transaction = db.transaction(['newBudget'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('newBudget');

                budgetObjectStore.clear();
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

window.addEventListener('online', uploadBudget);