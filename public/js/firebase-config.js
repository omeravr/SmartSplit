// Firebase configuration
// Initialize Firebase
const firebaseConfig = {
  // You'll need to replace these values with your own Firebase project config
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Group management
class FirebaseGroupManager {
  constructor() {
    this.currentGroupId = null;
  }

  // Create a new group
  async createGroup(groupName, creatorName) {
    try {
      const groupRef = database.ref('groups').push();
      const groupId = groupRef.key;
      
      await groupRef.set({
        name: groupName,
        createdBy: creatorName,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Create a 6-character access code for the group
      const accessCode = this.generateAccessCode();
      await database.ref(`accessCodes/${accessCode}`).set(groupId);
      
      return { 
        groupId, 
        accessCode 
      };
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }

  // Join a group using an access code
  async joinGroupWithCode(accessCode) {
    try {
      const groupIdRef = await database.ref(`accessCodes/${accessCode}`).get();
      if (!groupIdRef.exists()) {
        throw new Error("Invalid access code");
      }
      
      const groupId = groupIdRef.val();
      return groupId;
    } catch (error) {
      console.error("Error joining group:", error);
      throw error;
    }
  }

  // Generate a 6-character access code
  generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar-looking characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Set the current active group
  setCurrentGroup(groupId) {
    this.currentGroupId = groupId;
    localStorage.setItem('currentGroupId', groupId);
  }

  // Get the current active group
  getCurrentGroup() {
    if (!this.currentGroupId) {
      this.currentGroupId = localStorage.getItem('currentGroupId');
    }
    return this.currentGroupId;
  }
}

// Data synchronization
class FirebaseDataSync {
  constructor(groupManager) {
    this.groupManager = groupManager;
  }

  // Save data to Firebase
  async saveToFirebase(data) {
    const groupId = this.groupManager.getCurrentGroup();
    if (!groupId) {
      throw new Error("No active group selected");
    }

    try {
      await database.ref(`groupData/${groupId}`).set({
        members: data.members || [],
        expenses: data.expenses || [],
        settlements: data.settlements || [],
        nextMemberId: data.nextMemberId || 1,
        nextExpenseId: data.nextExpenseId || 1,
        nextSettlementId: data.nextSettlementId || 1,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error("Error saving data to Firebase:", error);
      throw error;
    }
  }

  // Load data from Firebase
  async loadFromFirebase() {
    const groupId = this.groupManager.getCurrentGroup();
    if (!groupId) {
      return null;
    }

    try {
      const snapshot = await database.ref(`groupData/${groupId}`).get();
      if (!snapshot.exists()) {
        return null;
      }
      
      return snapshot.val();
    } catch (error) {
      console.error("Error loading data from Firebase:", error);
      throw error;
    }
  }

  // Listen for real-time updates
  listenForUpdates(callback) {
    const groupId = this.groupManager.getCurrentGroup();
    if (!groupId) {
      return null;
    }

    const dataRef = database.ref(`groupData/${groupId}`);
    dataRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });

    // Return the reference so it can be turned off later
    return dataRef;
  }

  // Stop listening for updates
  stopListening(reference) {
    if (reference) {
      reference.off('value');
    }
  }
}

// Export the managers
window.firebaseGroupManager = new FirebaseGroupManager();
window.firebaseDataSync = new FirebaseDataSync(window.firebaseGroupManager); 