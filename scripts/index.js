let notes = [];
function FormSubmit(formElement, idnum) {
  formElement.onsubmit = (e) => {
    e.preventDefault();
    const title = formElement.querySelector("input[type='text']");
    const date = updateClock();
    if (!title.value.trim() || !date.trim()) {
      return;
    }
    createNote(title.value, date, idnum);
    formElement.reset();
  };
}

function createNote(title, date, idnum) {
  const localStorageKey = `notes_${idnum}`;
  if (getUserType().type == "patient") {
    let sender_Id1 = `patient_${idnum}`;
    const newNote1 = { title, date, time: Date.now(), sender_Id1 };
    const notesRef1 = firebase
      .database()
      .ref(`chats/doctor_${idnum}_patient_${details.patientId}/message`);
    // console.log("gge", details.patientId + 1);
    // console.log(notesRef1)
    notesRef1.push(newNote1);
    addLocalStorageData(idnum, newNote1);
    // displayNotes(idnum);
  }
  if (getUserType().type == "doctor") {
    let sender_Id2 = `doctor_${idnum}`;
    const newNote2 = { title, date, time: Date.now(), sender_Id2 };
    const notesRef2 = firebase
      .database()
      .ref(`chats/doctor_${details.doctorId}_patient_${idnum}/message`);
    notesRef2.push(newNote2);
    addLocalStorageData(idnum, newNote2);
    // displayNotes(idnum);
  }
}
function addLocalStorageData(idnum, newNotes) {
  const localStorageKey = `notes_${idnum}`;
  const existingNotesString = localStorage.getItem(localStorageKey);
  const existingNotes = existingNotesString
    ? JSON.parse(existingNotesString)
    : [];

  const updatedNotes = existingNotes.concat(newNotes);
  localStorage.setItem(localStorageKey, JSON.stringify(updatedNotes));
  console.log(updatedNotes);

  displayNotes(idnum);
}

function displayNotes(idnum) {
  const localStorageKey = `notes_${idnum}`;

  const localNotes = localStorage.getItem(localStorageKey);
  if (localNotes) {
    const allNotes = JSON.parse(localNotes);
    renderNotes(allNotes, idnum);
    console.log("data retrieved from localstorage");
  } else {
    console.log("no data in localstorage");
    getDataFromFirebase_updateLocalStorage(idnum);
  }
}
function getDataFromFirebase_updateLocalStorage(idnum, fromWhere = undefined) {
  let notesRef;
  if (getUserType().type == "patient") {
    notesRef = firebase
      .database()
      .ref(`chats/doctor_${idnum}_patient_${details.patientId}/message`);
  } else if (getUserType().type == "doctor") {
    notesRef = firebase
      .database()
      .ref(`chats/doctor_${details.doctorId}_patient_${idnum}/message`);
  }

  notesRef.once("value").then((snapshot) => {
    const notesData = snapshot.val();
    const notes = notesData ? Object.values(notesData) : [];
    notes.sort((a, b) => (a.time > b.time ? 1 : -1));

    renderNotes(notes, idnum, "fromDelete");

    const localStorageKey = `notes_${idnum}`;
    localStorage.setItem(localStorageKey, JSON.stringify(notes));
  });
}

function renderNotes(notes, idnum, fromWhere = undefined) {
  const ul = document.getElementById(`ul${idnum}`);
  if (!ul) {
    // console.log(`Could not find element with ID "ul${idnum}"`);
    return;
  } else {
  }
  document.querySelectorAll("li").forEach((child) => child.remove());
  notes.forEach((note) => {
    const li = document.createElement("li");
    const div = document.createElement("div");
    const h6 = document.createElement("h6");
    h6.innerText = note.date;
    li.innerText = note.title;
    div.appendChild(h6);
    li.appendChild(div);
    ul.appendChild(li);
    ul.className = "yui";
    if (getUserType().type == "patient") {
      if (note.sender_Id1) {
        li.classList.add("right_side-message");
      } else {
        li.classList.add("left_side-message");
      }
    } else {
      if (note.sender_Id2) {
        li.classList.add("right_side-message");
      } else {
        li.classList.add("left_side-message");
      }
    }
  });
  if (fromWhere === undefined) {
    const parent = ul.parentNode;
    parent.scrollTop = parent.scrollHeight;
  }
}

function clickHandler(event) {
  const clickedElement = event.target;
  let number;
  if (clickedElement) {
    if (clickedElement.classList == "right_side-message") {
      const existingModals = document.querySelectorAll(".modal");
      existingModals.forEach((modal) => modal.remove());

      const modal = document.createElement("div");
      modal.className = "modal";
      const x = event.clientX;
      const y = event.clientY;
      modal.style.left = x + "px";
      modal.style.top = y + "px";
      modal.textContent = "Delete Text?";
      document.body.appendChild(modal);
      modal.addEventListener("click", function (event) {
        let nodeNum = Array.from(clickedElement.parentNode.children).indexOf(
          clickedElement
        );
        const match = clickedElement.parentNode.id.match(/ul(\d+)/);

        if (match) {
          number = match[1];
          console.log("hehe", number);
        }

        if (details.type === "doctor") {
          const deleteRef = firebase
            .database()
            .ref(`chats/doctor_${details.doctorId}_patient_${number}/message`);
          deleteRef
            .once("value")
            .then((snapshot) => {
              const messages = snapshot.val();
              const messageKeys = Object.keys(messages);

              if (messageKeys.length > 0 && messageKeys[nodeNum]) {
                const MessageKey = messageKeys[nodeNum];

                const localStorageKey = `notes_${details.doctorId}`;
                const storedNotesString = localStorage.getItem(localStorageKey);
                const storedNotes = JSON.parse(storedNotesString);
                delete storedNotes[nodeNum];
                console.log(storedNotes);

                const deleteMessageRef = deleteRef.child(`/${MessageKey}`);
                return deleteMessageRef.remove();
              } else {
                console.log("No second node to delete.");
                return null;
              }
            })
            .then(() => {
              const ul = document.getElementById(`ul${details.doctorId}`);
              const parent = ul.parentNode;
              const currentScrollPosition = parent.scrollTop;
              getDataFromFirebase_updateLocalStorage(number, "fromDelete");
              parent.scrollTop = currentScrollPosition;
              const modal = document.querySelector(".modal");
              modal.remove();
              console.log("Message deleted successfully");
            })
            .catch((error) => {
              console.error("Error deleting second node:", error);
            });
        } else if (details.type === "patient") {
          const deleteRef = firebase
            .database()
            .ref(`chats/doctor_${number}_patient_${details.patientId}/message`);
          deleteRef
            .once("value")
            .then((snapshot) => {
              const messages = snapshot.val();
              const messageKeys = Object.keys(messages);

              if (messageKeys.length > 0 && messageKeys[nodeNum]) {
                const MessageKey = messageKeys[nodeNum];
                const deleteMessageRef = deleteRef.child(`/${MessageKey}`);
                return deleteMessageRef.remove();
              } else {
                console.log("No second node to delete.");
                return null;
              }
            })
            .then(() => {
              const ul = document.getElementById(`ul${details.patientId}`);
              const parent = ul.parentNode;
              const currentScrollPosition = parent.scrollTop;
              getDataFromFirebase_updateLocalStorage(number, "fromDelete");
              parent.scrollTop = currentScrollPosition;
              const modal = document.querySelector(".modal");
              modal.remove();
              console.log("Message deleted successfully");
            })
            .catch((error) => {
              console.error("Error deleting second node:", error);
            });
        }
      });
    } else {
      const modal = document.querySelector(".modal");
      if (modal == null || clickedElement.classList == "modal") {
        return;
      } else {
        modal.remove();
      }
    }
  }
}

function getIdNum(onlyNum) {
  const numbers = onlyNum.match(/\d+/g);
  if (numbers) {
    const allNumbers = numbers.sort((a, b) => a - b);
    idnum = allNumbers.join("");
  }
  return idnum;
}
function getSendIdNum(button) {
  onlyNum = button.id;
  getIdNum(onlyNum);
  parameter1 = "form_" + idnum;
  // parameter2 = "createNote" + idnum;
  FormSubmit(document.getElementById(parameter1), idnum);
}
function getUserSelectIdNum(button) {
  onlyNum = button.id;
  getIdNum(onlyNum);
  // console.log(idnum);
  parameter1 = "item-" + idnum;
  document.getElementById(parameter1).checked = true;

  // const selectedForm = document.querySelector(`.form-container${idnum}`);
  const containers = document.querySelectorAll(
    "[class^='notes-container'], [class^='form-container'], [class^='user']"
  );
  // const user = document.querySelector(`.user${i}`);
  containers.forEach((container) => {
    // if (container.classList.contains(`notes-container${idnum}`) || container.classList.contains(`form-container${idnum}`)) {
    if (
      container.classList.contains(`notes-container${idnum}`) ||
      container.classList.contains(`form-container${idnum}`) ||
      container.classList.contains(`user${idnum}`)
    ) {
      container.style.display = "block";
    } else {
      container.style.display = "none";
    }
  });
  displayNotes(idnum);
}
function pfp_open() {
  // const ele1 = document.getElementById("pfp");
  // const ele2 = document.getElementById("arrow");
  // const ele3 = document.getElementById("arrow_span0");
  // const ele4 = document.getElementById("pfp_zoom");
  // const ele5 = document.getElementById("details");
  // ele1.className =
  //   ele1.className === "profile_closed"
  //     ? "profile_closed profile_open"
  //     : "profile_closed";
  // ele2.className = ele2.className === "old_arrow" ? "arrow" : "old_arrow";
  // ele3.className =
  //   ele3.className === "arrow_span0" ? "arrow_span" : "arrow_span0";
  // ele4.className =
  //   ele4.className === "pfp_zoom" ? "pfp_zoom pfp_zoom1" : "pfp_zoom";
  // ele5.className =
  //   ele5.className === "details" ? "details details1" : "details";
}

function pad(num) {
  return String("0" + num).slice(-2);
}
function updateClock() {
  var now = new Date();
  var time = pad(now.getHours()) + ":" + pad(now.getMinutes());
  return (document.querySelector(".date").value = time);
}

const radioInputs = document.getElementById("radio_inputs");

function makeUsers(numInputs, Name, type) {
  document.addEventListener("click", clickHandler);
  const newInput = document.createElement("input");
  newInput.type = "radio";
  newInput.name = "users";
  newInput.id = `item-${numInputs}`;
  radioInputs.appendChild(newInput);

  const user_select = document.getElementById("user_select");
  const newUser = document.createElement("div");
  newUser.id = `for-item-${numInputs}`;
  newUser.classList.add("ppl");
  newUser.onclick = function () {
    getUserSelectIdNum(this);
    toggleBox(0);
    getDataFromFirebase_updateLocalStorage(numInputs);
  };

  const newUserInnerDiv = document.createElement("div");
  const newUserInnerSpan = document.createElement("span");
  newUser.appendChild(newUserInnerDiv);
  newUser.appendChild(newUserInnerSpan);

  newUserInnerSpan.textContent = Name;
  user_select.appendChild(newUser);

  const notes_side = document.getElementById("notes_side");
  const inputNew = document.createElement("input");
  inputNew.type = "file";
  inputNew.id = `upload_${numInputs}`;
  inputNew.hidden = true;

  const label = document.createElement("label");
  label.className = "card_";
  label.htmlFor = `item-${numInputs}`;
  label.id = `user-${numInputs}`;

  const userCard = document.createElement("div");
  userCard.className = `user_card user${numInputs}`;

  const notesContainerX = document.createElement("div");
  notesContainerX.className = `notes-container${numInputs}`;

  const ul = document.createElement("ul");
  ul.id = `ul${numInputs}`;

  label.appendChild(userCard);
  userCard.appendChild(notesContainerX);
  notesContainerX.appendChild(ul);
  notes_side.appendChild(inputNew);
  notes_side.appendChild(label);
  notes_side.appendChild(userCard);

  const formContainer = document.getElementById("form_containers");
  const parent_container = document.createElement("div");
  parent_container.className = `form-container${numInputs}`;
  const newForm = document.createElement("form");
  newForm.classList.add(`form_${numInputs}`);
  newForm.id = `form_${numInputs}`;

  const uploadLabel = document.createElement("label");
  uploadLabel.classList.add("upload");
  uploadLabel.setAttribute("for", `upload_${numInputs}`);

  const uploadImg = document.createElement("img");
  uploadImg.src = "/images/Clip_icon.png";
  uploadImg.alt = "upload";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = `upload_${numInputs}`;
  fileInput.style.display = "none";

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.id = `title${numInputs}`;
  // titleInput.placeholder = `bar_${numInputs}`;
  titleInput.placeholder = "Type a message";

  const dateInput = document.createElement("input");
  dateInput.type = "text";
  dateInput.classList.add("date");

  const sendButton = document.createElement("button");
  sendButton.type = "submit";
  sendButton.id = `send${numInputs}`;
  sendButton.onclick = function () {
    getSendIdNum(this);
  };

  const sendImg = document.createElement("img");
  sendImg.src = "/images/Send_icon.png";
  sendImg.alt = "send";

  sendButton.appendChild(sendImg);
  uploadLabel.appendChild(uploadImg);
  uploadLabel.appendChild(fileInput);
  newForm.appendChild(uploadLabel);
  newForm.appendChild(titleInput);
  newForm.appendChild(dateInput);
  newForm.appendChild(sendButton);
  parent_container.appendChild(newForm);
  formContainer.appendChild(parent_container);

  const radioButtons = document.querySelectorAll('input[type="radio"]');
  const idNumbers = {};
  radioButtons.forEach((button) => {
    idNumbers[getIdNum(button.id)] = true;
  });
}

const fileInput = document.querySelectorAll('[id^="upload_"]');

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    const img = new Image();
    img.src = reader.result;
    document.body.appendChild(img);
  });

  reader.readAsDataURL(file);
});

function resize() {
  const container_3 = document.getElementById("container_3");
  const cards = document.getElementById("cards");
  if (window.innerWidth < 671) {
    if (cards.className == "cards") {
      cards.className = "cards more_width_cards";
      container_3.className = "more_width_container_3";
    }
  } else {
    cards.className = "cards";
    container_3.className = "";
  }
}

resize();
window.addEventListener("resize", function () {
  resize();
});

var ppl = document.querySelectorAll("[id^='for-item-']");

for (var i = 0; i < ppl.length; i++) {
  ppl[i].addEventListener("click", function () {
    for (var j = 0; j < ppl.length; j++) {
      ppl[j].classList.remove("selected");
    }
    this.classList.add("selected");
  });
}

function toggleBox(toggleCounter) {
  // if (toggleCounter < 2) {
    const cards = document.getElementById("cards");
    const container_3 = document.getElementById("container_3");
    if (window.innerWidth < 671) {
      cards.className =
        cards.className === "cards more_width_cards"
          ? "cards more_width_cards"
          : "cards less_width_cards";
      container_3.className =
        container_3.className === "more_width_container_3"
          ? "less_width_container_3"
          : "more_width_container_3";
      console.log(container_3.className);

    //   toggleCounter++;
    //   toggleBox(toggleCounter);
    // }
  }
}

// const container_3 = document.getElementById("container_3");
// container_3.className = "less_width_container_3";



// - doctors
//   - doctor1
//     - name: "Dr. John"
//     - ...
// - patients
//   - patient1
//     - name: "Alice"
//     - doctorId: "doctor1"
//     - ...
//   - patient2
//     - name: "Bob"
//     - doctorId: "doctor1"
//     - ...
// - chats
//   - doctor1_patient1
//     - messages
//       - messageId1
//         - senderId: "patient1"
//         - message: "Hello Doctor!"
//         - timestamp: ...
//       - messageId2
//         - senderId: "doctor1"
//         - message: "Hi Alice, how can I help you today?"
//         - timestamp: ...
//       - ...
//   - doctor1_patient2
//     - messages
//       - messageId1
//         - senderId: "patient2"
//         - message: "Hi Doctor"
//         - timestamp: ...
//       - messageId2
//         - senderId: "doctor1"
//         - message: "Hello Bob, how are you feeling today?"
//         - timestamp: ...
//       - ...
