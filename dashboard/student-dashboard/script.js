import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPWr-6clbipRfvCkty0GF9vj7GhbJhut8",
  authDomain: "skillsync-a6e61.firebaseapp.com",
  projectId: "skillsync-a6e61",
  storageBucket: "skillsync-a6e61.firebasestorage.app",
  messagingSenderId: "213330406465",
  appId: "1:213330406465:web:65bb9762130f9d5c68eac0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const QUIZAPI_KEY = "DmwyAl55lMloRgNE70Rf57FYFfErnCQeVLwKq3TX"; 

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const body = document.querySelector("body");

  // Add the 'show' class to trigger the animation
  setTimeout(() => {
    body.classList.add("show");
  }, 200); // Delay to make the animation smooth

  // Get elements
  const modal = document.getElementById("userDetailsModal");
  const usernameTrigger = document.getElementById("usernameTrigger");
  const profileTrigger = document.getElementById("profileTrigger");
  const closeIcon = document.querySelector(".cross-image img");
  const overlay = document.querySelector(".overlay");
  const logoutButton = document.querySelector(".logout-button");
  

  // Function to open the modal
  function openModal() {
    modal.classList.add("active");
    overlay.classList.add("overlayactive");
    overlay.style.display = "block";
  }

  // Function to close the modal
  function closeModal() {
    modal.classList.remove("active");
    overlay.classList.remove("overlayactive");
  }

  // Open modal when clicking on username or profile icon
  if (usernameTrigger) usernameTrigger.addEventListener("click", openModal);
  if (profileTrigger) profileTrigger.addEventListener("click", openModal);

  // Close modal when clicking on the close icon
  if (closeIcon) closeIcon.addEventListener("click", closeModal);
  if (overlay) overlay.addEventListener("click", closeModal);

  // Close modal when clicking outside the modal content
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Logout button logic
  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault(); // Prevent the default link behavior

      signOut(auth)
        .then(() => {
          console.log("User successfully logged out.");
          // Redirect to the landing page or login page
          window.location.href = "../../index.html"; // Replace with the actual landing page URL
        })
        .catch((error) => {
          console.error("Error during logout:", error);
          alert("Error during logout. Please try again.");
        });
    });
  }

  // Monitor Authentication State
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Reference the user document
        const userDocRef = doc(db, "Users", user.uid);

        // Fetch the user document
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Extract user data
          const userData = userDoc.data();

          // Dynamically update the HTML with user details
          const updateElementText = (selector, text) => {
            const element = document.querySelector(selector);
            if (element) element.innerText = text || "N/A";
          };

          updateElementText(
            ".fullname-section p:nth-child(2)",
            userData.username
          );
          updateElementText(".bio-section p:nth-child(2)", userData.bio);
          updateElementText(".email-section p:nth-child(2)", user.email);
          updateElementText(".role-section p:nth-child(2)", userData.role);
          updateElementText(".age-section p:nth-child(2)", userData.age);
          updateElementText(
            ".dob-section p:nth-child(2)",
            userData.dateOfBirth
          );
          updateElementText(".gender-section p:nth-child(2)", userData.gender);
          updateElementText(
            ".experience-section p:nth-child(2)",
            userData.industryExperience
          );
          updateElementText(
            ".portfolio-section p:nth-child(2)",
            userData.portfolio
          );
          updateElementText(
            ".interested-fields-section p:nth-child(2)",
            Array.isArray(userData.interestedFields)
              ? `[${userData.interestedFields.join(", ")}]`
              : userData.interestedFields
          );
          updateElementText(
            ".interested-skills-section p:nth-child(2)",
            userData.interestedSkills
              ? `[${Object.keys(userData.interestedSkills).join(", ")}]`
              : "N/A"
          );

          // Update username in the top-left corner
          updateElementText(".username-section p", userData.username || "User");

          // Render assessment cards
          if (userData.interestedSkills) {
            await renderAssessmentCards(userData.interestedSkills);
          }
        } else {
          console.error("No user document found.");
          alert("No user details found. Please complete your profile.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        alert("Error fetching user details. Please try again.");
      }
    } else {
      console.log("No user is logged in.");
      alert("Please log in to view your details.");
    }
  });
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function renderAssessmentCards(interestedSkills) {
  const container = document.getElementById("assessment-cards-container");
  if (!container) {
    console.error("Assessment cards container not found.");
    return;
  }
  
  // Step 1: Immediately add placeholder cards to the container
  addPlaceholderCards(container, 4);

  const quizPromises = []; // Array to store promises
  const quizData = []; // Array to store fetched quizzes and their metadata

  // Fetch quizzes for all skills and difficulties
  for (const skill of Object.keys(interestedSkills)) {
    const difficulties = ["Easy", "Medium", "Hard"];
    for (const difficulty of difficulties) {
      quizPromises.push(
        fetchQuizzes(skill, difficulty).then((quizzes) => {
          if (quizzes && quizzes.length > 0) {
            quizData.push({ skill, difficulty, quizzes });
          }
        })
      );
    }
  }

  // Wait for all fetch calls to complete
  await Promise.all(quizPromises);

  // Step 2: Clear the placeholders and render fetched data
  container.innerHTML = "";

  // Step 3: Render cards for quizzes with data
  quizData.forEach(({ skill, difficulty }) => {
    const card = document.createElement("div");
    card.className = "card quiz-card";
    card.innerHTML = `<div class="quiz-box">
                        <h1>${skill}</h1>
                        <p>${difficulty} Level</p>
                        <p class="quiz-description">Test your knowledge of ${skill} at the ${difficulty.toLowerCase()} level.</p>
                        <button class="button-35" role="button">Start Assessment</button>
                      </div>`;
    container.appendChild(card);
  });

  // If no quizzes were found, show a fallback message
  if (quizData.length === 0) {
    container.innerHTML = `<p class="no-quizzes-message">No quizzes are currently available for your selected skills.</p>`;
  }
}

// Helper function to add placeholder cards instantly
function addPlaceholderCards(container, count) {
  container.innerHTML = ""; // Clear any existing content first
  for (let i = 0; i < count; i++) {
    const placeholder = document.createElement("div");
    placeholder.className = "card placeholder-card";
    placeholder.innerHTML = `<div class="quiz-box">
                               <div class="placeholder-title"></div>
                               <div class="placeholder-level"></div>
                               <div class="placeholder-button"></div>
                             </div>`;
    container.appendChild(placeholder);
  }
}






// let sessionToken = null;

// async function getSessionToken() {
//   const tokenUrl = "https://opentdb.com/api_token.php?command=request";
//   const response = await fetch(tokenUrl);
//   const data = await response.json();
//   return data.token;
// }

async function fetchQuizzes(skill, difficulty) {
  const apiUrl = `https://skillsync-backend-1-s85m.onrender.com/api/questions/${skill}`;

  console.log("Fetching quizzes from:", apiUrl); // Debug: Log the API URL


  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log("API Response:", data); // Debug: Log the API response

    if (Array.isArray(data) && data.length > 0) {
      // Filter quizzes by difficulty (if needed)
      const filteredQuizzes = data.filter(quiz => quiz.difficulty === difficulty.toLowerCase());
      return filteredQuizzes; // Return filtered quizzes
    } else {
      console.error("No quizzes found or API error:", data);
      return null;
    }
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return null;
  }
}
// Handle "Start Assessment" button clicks
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("button-35")) {
    const skill = event.target
      .closest(".quiz-box")
      .querySelector("h1").innerText;
    const difficulty = event.target
      .closest(".quiz-box")
      .querySelector("p").innerText;
    startAssessment(skill, difficulty);
  }
});

function startAssessment(skill, difficulty) {
  // Fetch quizzes for the selected skill and difficulty
  fetchQuizzes(skill, difficulty).then(quizzes => {
    if (quizzes && quizzes.length > 0) {
      // Store quizzes in localStorage
      localStorage.setItem("currentQuiz", JSON.stringify(quizzes));

      // Redirect to quiz.html
      window.location.href = `quiz.html?skill=${encodeURIComponent(skill)}&difficulty=${encodeURIComponent(difficulty)}`;
    } else {
      alert("No quizzes available for the selected skill and difficulty.");
    }
  });
}