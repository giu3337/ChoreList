import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase configuration
const appSettings = {
    databaseURL: "https://chorelist-ca568-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(appSettings);
const database = getDatabase(app);
const choresRef = ref(database, 'chores');

// Get DOM elements
const inputEl = document.getElementById('newChoreInput');
const addBtn = document.getElementById('addChoreButton');
const deleteAllBtn = document.getElementById('deleteAllChores');
const ulEl = document.getElementById('choresLiContainer');

// Function to render chores
function renderChores(chores) {
    ulEl.innerHTML = ''; // Clear current list

    if (chores.length === 0) {
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
        chores.sort((a, b) => a.order - b.order);

        chores.forEach((chore, index) => {
            const liEl = document.createElement('li');
            liEl.textContent = chore.text;
            liEl.setAttribute('draggable', !isMobileDevice);
            liEl.setAttribute('data-id', chore.id);
            liEl.setAttribute('data-index', index);

            let lastTap = 0;
            liEl.addEventListener('dblclick', function() {
                deleteChore(chore.id);
            });
            liEl.addEventListener('touchend', function(e) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                    deleteChore(chore.id);
                }
                lastTap = currentTime;
                e.preventDefault();
            });

            if (!isMobileDevice) {
                liEl.addEventListener('dragstart', handleDragStart);
                liEl.addEventListener('dragover', handleDragOver);
                liEl.addEventListener('drop', handleDrop);
                liEl.addEventListener('dragenter', handleDragEnter);
                liEl.addEventListener('dragleave', handleDragLeave);
            }

            ulEl.appendChild(liEl);
        });
    }
}

// Load chores from Firebase
onValue(choresRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        const chores = Object.keys(data).map(key => ({
            id: key,
            text: data[key].text,
            order: data[key].order || 0
        }));
        renderChores(chores);
    } else {
        renderChores([]);
    }
}, (error) => {
    console.error("Error loading chores: ", error);
});

// Event listener to add a new chore
addBtn.addEventListener('click', function() {
    const newChore = inputEl.value.trim();
    if (newChore) {
        const newChoreData = {
            text: newChore,
            order: Date.now()
        };
        push(choresRef, newChoreData)
            .then(() => {
                console.log(`${newChore} added to database`);
                inputEl.value = '';
            })
            .catch((error) => {
                console.error("Error adding chore: ", error);
            });
    }
});

// Event listener to delete all chores
deleteAllBtn.addEventListener('click', function() {
    remove(choresRef)
        .then(() => {
            console.log("All chores deleted");
        })
        .catch((error) => {
            console.error("Error deleting all chores: ", error);
        });
});

// Function to delete a specific chore
function deleteChore(choreId) {
    const choreRef = ref(database, `chores/${choreId}`);
    remove(choreRef)
        .then(() => {
            console.log(`Chore ${choreId} deleted`);
        })
        .catch((error) => {
            console.error(`Error deleting chore ${choreId}: `, error);
        });
}

// Drag-and-drop handlers
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    if (draggedElement !== e.target) {
        const draggedIndex = parseInt(draggedElement.getAttribute('data-index'), 10);
        const targetIndex = parseInt(e.target.getAttribute('data-index'), 10);

        const chores = Array.from(ulEl.children).map(child => ({
            id: child.getAttribute('data-id'),
            text: child.textContent,
            order: parseInt(child.getAttribute('data-index'), 10)
        }));

        const draggedChore = chores.splice(draggedIndex, 1)[0];
        chores.splice(targetIndex, 0, draggedChore);

        chores.forEach((chore, index) => {
            const liEl = ulEl.querySelector(`[data-id='${chore.id}']`);
            liEl.setAttribute('data-index', index);
        });

        const updates = {};
        chores.forEach((chore, index) => {
            updates[chore.id] = { text: chore.text, order: index };
        });

        update(choresRef, updates)
            .then(() => {
                console.log('Chores reordered');
                renderChores(chores);
            })
            .catch((error) => {
                console.error('Error reordering chores: ', error);
            });
    }
    draggedElement.classList.remove('dragging');
    return false;
}

function handleDragEnter(e) {
    if (e.target.tagName === 'LI' && e.target !== draggedElement) {
        e.target.classList.add('over');
    }
}

function handleDragLeave(e) {
    if (e.target.tagName === 'LI') {
        e.target.classList.remove('over');
    }
}

// Device type detection
const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);

if (isMobileDevice) {
    // Disable dragging and ensure scrolling
    ulEl.style.overflowY = 'scroll';
    ulEl.style.touchAction = 'pan-y';
} else {
    // Apply drag-and-drop event listeners for desktop devices
    ulEl.addEventListener('dragstart', handleDragStart);
    ulEl.addEventListener('dragover', handleDragOver);
    ulEl.addEventListener('drop', handleDrop);
    ulEl.addEventListener('dragenter', handleDragEnter);
    ulEl.addEventListener('dragleave', handleDragLeave);
}
