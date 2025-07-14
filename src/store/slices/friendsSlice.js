import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  friends: [],
  friendRequests: [],
  loading: false,
  error: null,
};

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    setFriends: (state, action) => {
      state.friends = action.payload;
      state.loading = false;
      state.error = null;
    },
    addFriend: (state, action) => {
      state.friends.push(action.payload);
    },
    removeFriend: (state, action) => {
      state.friends = state.friends.filter(friend => friend.id !== action.payload);
    },
    setFriendRequests: (state, action) => {
      state.friendRequests = action.payload;
    },
    addFriendRequest: (state, action) => {
      state.friendRequests.push(action.payload);
    },
    removeFriendRequest: (state, action) => {
      state.friendRequests = state.friendRequests.filter(request => request.id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { 
  setFriends, 
  addFriend, 
  removeFriend, 
  setFriendRequests, 
  addFriendRequest, 
  removeFriendRequest, 
  setLoading, 
  setError 
} = friendsSlice.actions;

export default friendsSlice.reducer;
