import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc,
  deleteDoc,
  or
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

// Async thunks for friends
export const sendFriendRequest = createAsyncThunk(
  'friends/sendFriendRequest',
  async ({ fromUserId, toUserId, fromUserName }, { rejectWithValue }) => {
    try {
      const requestData = {
        fromUserId,
        toUserId,
        fromUserName,
        status: 'pending',
        createdAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'friendRequests'), requestData);
      
      return {
        id: docRef.id,
        ...requestData,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFriendRequests = createAsyncThunk(
  'friends/fetchFriendRequests',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return requests;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptFriendRequest',
  async ({ requestId, fromUserId, toUserId }, { rejectWithValue }) => {
    try {
      // Update request status
      const requestRef = doc(db, 'friendRequests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: new Date(),
      });
      
      // Create friendship record
      const friendshipData = {
        user1: fromUserId,
        user2: toUserId,
        createdAt: new Date(),
        isActive: true,
      };
      
      await addDoc(collection(db, 'friendships'), friendshipData);
      
      return { requestId, friendship: friendshipData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'friends/rejectFriendRequest',
  async ({ requestId }, { rejectWithValue }) => {
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date(),
      });
      
      return requestId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, 'friendships'),
        or(
          where('user1', '==', userId),
          where('user2', '==', userId)
        ),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const friendships = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const friendId = data.user1 === userId ? data.user2 : data.user1;
        friendships.push({
          id: doc.id,
          friendId,
          createdAt: data.createdAt,
        });
      });
      
      return friendships;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFriend = createAsyncThunk(
  'friends/removeFriend',
  async ({ friendshipId }, { rejectWithValue }) => {
    try {
      const friendshipRef = doc(db, 'friendships', friendshipId);
      await updateDoc(friendshipRef, {
        isActive: false,
        removedAt: new Date(),
      });
      
      return friendshipId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchUsers = createAsyncThunk(
  'friends/searchUsers',
  async ({ searchTerm, currentUserId }, { rejectWithValue }) => {
    try {
      // Note: This is a simplified search. In production, you might want to use
      // Algolia or implement a more sophisticated search
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (
          userData.uid !== currentUserId &&
          (userData.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userData.email?.toLowerCase().includes(searchTerm.toLowerCase()))
        ) {
          users.push({
            id: doc.id,
            ...userData,
          });
        }
      });
      
      return users;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const friendsSlice = createSlice({
  name: 'friends',
  initialState: {
    friends: [],
    friendRequests: [],
    searchResults: [],
    loading: false,
    searchLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Send friend request
      .addCase(sendFriendRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch friend requests
      .addCase(fetchFriendRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.friendRequests = action.payload;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Accept friend request
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const { requestId } = action.payload;
        state.friendRequests = state.friendRequests.filter(req => req.id !== requestId);
      })
      // Reject friend request
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        const requestId = action.payload;
        state.friendRequests = state.friendRequests.filter(req => req.id !== requestId);
      })
      // Fetch friends
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove friend
      .addCase(removeFriend.fulfilled, (state, action) => {
        const friendshipId = action.payload;
        state.friends = state.friends.filter(friend => friend.id !== friendshipId);
      })
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSearchResults } = friendsSlice.actions;
export default friendsSlice.reducer;
