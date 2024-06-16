// Get DOM elements
const inputEl = document.getElementById('newChoreInput');
const addBtn = document.getElementById('addChoreButton');
const deleteAllBtn = document.getElementById('deleteAllChores');
const ulEl = document.getElementById('choresLiContainer');

// Initialize chores array from local storage if available
let chores = [];

if (localStorage.getItem('chores')) {
    chores = JSON.parse(localStorage.getItem('chores'));
}

// Function to render chores
function renderChores() {
    ulEl.innerHTML = ''; // Clear current list

    if (chores.length === 0) {
        // Show a GIF when there are no chores
        ulEl.innerHTML = `
            <div class="empty-state">
                <iframe 
                    src="https://giphy.com/embed/xT77XWum9yH7zNkFW0" 
                    class="giphy-embed" 
                    frameBorder="0" 
                    allowFullScreen>
                </iframe>
            </div>`;
    } else {
        // Create list items for each chore
        chores.forEach(chore => {
            const liEl = document.createElement('li');
            liEl.textContent = chore;
            liEl.addEventListener('dblclick', function() {
                deleteChore(chore);
            });
            ulEl.appendChild(liEl);
        });
    }
}

// Event listener to add a new chore
addBtn.addEventListener('click', function() {
    const newChore = inputEl.value.trim();
    if (newChore) {
        chores.push(newChore);
        localStorage.setItem('chores', JSON.stringify(chores));
        renderChores();
        inputEl.value = ''; // Clear the input field
    }
});

// Event listener to delete all chores
deleteAllBtn.addEventListener('click', function() {
    chores = [];
    localStorage.setItem('chores', JSON.stringify(chores));
    renderChores();
});

// Function to delete a specific chore
function deleteChore(chore) {
    const index = chores.indexOf(chore);
    if (index > -1) {
        chores.splice(index, 1);
        localStorage.setItem('chores', JSON.stringify(chores));
        renderChores();
    }
}

// Initial render to display chores from local storage
renderChores();