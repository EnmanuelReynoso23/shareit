import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  or,
  and
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import userService from './userService';

class FriendsService {
  constructor() {
    this.requestsCollection = 'friendRequests';
    this.friendshipsCollection = 'friendships';
  }

  // Utility function to validate required parameters
  validateParams(params, requiredFields) {
    for (const field of requiredFields) {
      if (params[field] === null || params[field] === undefined || params[field] === '') {
        throw new Error(`Missing required parameter: ${field}`);
      }
    }
  }

  // Safe profile fetch with fallback
  async safeGetUserProfile(userId) {
    if (!userId || typeof userId !== 'string') {
      return null;
    }

    try {
      const profile = await userService.getUserProfile(userId);
      if (!profile) {
        return null;
      }

      // Return safe profile with null checks
      return {
        uid: profile.uid || userId,
        displayName: profile.displayName || 'Unknown User',
        photoURL: profile.photoURL || null,
        bio: profile.bio || '',
        email: profile.email || '',
        isPublic: profile.isPublic !== undefined ? profile.isPublic : true
      };
    } catch (error) {
      console.warn(`Could not fetch profile for user ${userId}:`, error);
      return {
        uid: userId,
        displayName: 'Unknown User',
        photoURL: null,
        bio: '',
        email: '',
        isPublic: true
      };
    }
  }

  // Safe data extraction from Firestore document
  safeExtractDocData(doc) {
    if (!doc || !doc.exists()) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

    return {
      id: doc.id,
      ...data
    };
  }

  // Friend request status
  static REQUEST_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    CANCELLED: 'cancelled'
  };

  // Send friend request
  async sendFriendRequest(senderId, receiverId, message = '') {
    try {
      // Validate required parameters
      this.validateParams({ senderId, receiverId }, ['senderId', 'receiverId']);
      
      if (senderId === receiverId) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Validate that both users exist
      const [senderProfile, receiverProfile] = await Promise.all([
        this.safeGetUserProfile(senderId),
        this.safeGetUserProfile(receiverId)
      ]);

      if (!senderProfile) {
        throw new Error('Sender profile not found');
      }

      if (!receiverProfile) {
        throw new Error('Receiver profile not found');
      }

      // Check if users are already friends
      const existingFriendship = await this.checkFriendship(senderId, receiverId);
      if (existingFriendship) {
        throw new Error('Users are already friends');
      }

      // Check if there's already a pending request
      const existingRequest = await this.getPendingRequest(senderId, receiverId);
      if (existingRequest) {
        throw new Error('Friend request already sent');
      }

      // Check if there's a reverse request (receiver sent to sender)
      const reverseRequest = await this.getPendingRequest(receiverId, senderId);
      if (reverseRequest) {
        // Auto-accept if there's a reverse request
        return await this.acceptFriendRequest(reverseRequest.id, receiverId);
      }

      const requestData = {
        senderId,
        receiverId,
        message: message || '',
        status: FriendsService.REQUEST_STATUS.PENDING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.requestsCollection), requestData);
      
      return {
        id: docRef.id,
        ...requestData
      };
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw new Error(`Failed to send friend request: ${error.message}`);
    }
  }

  // Get pending friend request between two users
  async getPendingRequest(senderId, receiverId) {
    try {
      const q = query(
        collection(db, this.requestsCollection),
        where('senderId', '==', senderId),
        where('receiverId', '==', receiverId),
        where('status', '==', FriendsService.REQUEST_STATUS.PENDING)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting pending request:', error);
      throw new Error(`Failed to get pending request: ${error.message}`);
    }
  }

  // Accept friend request
  async acceptFriendRequest(requestId, userId) {
    try {
      const request = await this.getFriendRequest(requestId);
      
      if (request.receiverId !== userId) {
        throw new Error('Unauthorized: You can only accept requests sent to you');
      }

      if (request.status !== FriendsService.REQUEST_STATUS.PENDING) {
        throw new Error('Request is not pending');
      }

      // Update request status
      await updateDoc(doc(db, this.requestsCollection, requestId), {
        status: FriendsService.REQUEST_STATUS.ACCEPTED,
        updatedAt: serverTimestamp()
      });

      // Create friendship
      const friendship = await this.createFriendship(request.senderId, request.receiverId);

      // Update user friends lists
      await userService.addFriend(request.senderId, request.receiverId);

      return {
        success: true,
        friendship,
        request: {
          id: requestId,
          ...request,
          status: FriendsService.REQUEST_STATUS.ACCEPTED
        }
      };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw new Error(`Failed to accept friend request: ${error.message}`);
    }
  }

  // Decline friend request
  async declineFriendRequest(requestId, userId) {
    try {
      const request = await this.getFriendRequest(requestId);
      
      if (request.receiverId !== userId) {
        throw new Error('Unauthorized: You can only decline requests sent to you');
      }

      if (request.status !== FriendsService.REQUEST_STATUS.PENDING) {
        throw new Error('Request is not pending');
      }

      await updateDoc(doc(db, this.requestsCollection, requestId), {
        status: FriendsService.REQUEST_STATUS.DECLINED,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw new Error(`Failed to decline friend request: ${error.message}`);
    }
  }

  // Cancel friend request
  async cancelFriendRequest(requestId, userId) {
    try {
      const request = await this.getFriendRequest(requestId);
      
      if (request.senderId !== userId) {
        throw new Error('Unauthorized: You can only cancel requests you sent');
      }

      if (request.status !== FriendsService.REQUEST_STATUS.PENDING) {
        throw new Error('Request is not pending');
      }

      await updateDoc(doc(db, this.requestsCollection, requestId), {
        status: FriendsService.REQUEST_STATUS.CANCELLED,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error canceling friend request:', error);
      throw new Error(`Failed to cancel friend request: ${error.message}`);
    }
  }

  // Get friend request by ID
  async getFriendRequest(requestId) {
    try {
      const docRef = doc(db, this.requestsCollection, requestId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Friend request not found');
      }
    } catch (error) {
      console.error('Error getting friend request:', error);
      throw new Error(`Failed to get friend request: ${error.message}`);
    }
  }

  // Get received friend requests
  async getReceivedRequests(userId, limitCount = 20) {
    try {
      // Validate required parameters
      this.validateParams({ userId }, ['userId']);
      
      if (typeof limitCount !== 'number' || limitCount <= 0) {
        limitCount = 20;
      }

      const q = query(
        collection(db, this.requestsCollection),
        where('receiverId', '==', userId),
        where('status', '==', FriendsService.REQUEST_STATUS.PENDING),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const requests = [];
      
      for (const doc of querySnapshot.docs) {
        const requestData = this.safeExtractDocData(doc);
        if (!requestData) {
          console.warn(`Invalid document data for request ${doc.id}`);
          continue;
        }

        // Validate required fields
        if (!requestData.senderId) {
          console.warn(`Request ${doc.id} missing senderId`);
          continue;
        }
        
        // Get sender information safely
        const senderProfile = await this.safeGetUserProfile(requestData.senderId);
        if (senderProfile) {
          requestData.senderInfo = {
            uid: senderProfile.uid,
            displayName: senderProfile.displayName,
            photoURL: senderProfile.photoURL,
            bio: senderProfile.bio,
            isPublic: senderProfile.isPublic
          };
        } else {
          // Provide fallback sender info
          requestData.senderInfo = {
            uid: requestData.senderId,
            displayName: 'Unknown User',
            photoURL: null,
            bio: '',
            isPublic: true
          };
        }
        
        requests.push(requestData);
      }

      return requests;
    } catch (error) {
      console.error('Error getting received requests:', error);
      throw new Error(`Failed to get received requests: ${error.message}`);
    }
  }

  // Get sent friend requests
  async getSentRequests(userId, limitCount = 20) {
    try {
      const q = query(
        collection(db, this.requestsCollection),
        where('senderId', '==', userId),
        where('status', '==', FriendsService.REQUEST_STATUS.PENDING),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const requests = [];
      
      for (const doc of querySnapshot.docs) {
        const requestData = {
          id: doc.id,
          ...doc.data()
        };
        
        // Get receiver information
        try {
          const receiverProfile = await userService.getUserProfile(requestData.receiverId);
          requestData.receiverInfo = {
            uid: receiverProfile.uid,
            displayName: receiverProfile.displayName,
            photoURL: receiverProfile.photoURL,
            bio: receiverProfile.bio
          };
        } catch (error) {
          console.warn(`Could not fetch receiver info for request ${doc.id}:`, error);
        }
        
        requests.push(requestData);
      }

      return requests;
    } catch (error) {
      console.error('Error getting sent requests:', error);
      throw new Error(`Failed to get sent requests: ${error.message}`);
    }
  }

  // Create friendship
  async createFriendship(user1Id, user2Id) {
    try {
      const friendshipData = {
        user1Id,
        user2Id,
        createdAt: serverTimestamp(),
        status: 'active'
      };

      const docRef = await addDoc(collection(db, this.friendshipsCollection), friendshipData);
      
      return {
        id: docRef.id,
        ...friendshipData
      };
    } catch (error) {
      console.error('Error creating friendship:', error);
      throw new Error(`Failed to create friendship: ${error.message}`);
    }
  }

  // Check if users are friends
  async checkFriendship(user1Id, user2Id) {
    try {
      const q = query(
        collection(db, this.friendshipsCollection),
        or(
          and(
            where('user1Id', '==', user1Id),
            where('user2Id', '==', user2Id)
          ),
          and(
            where('user1Id', '==', user2Id),
            where('user2Id', '==', user1Id)
          )
        ),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking friendship:', error);
      throw new Error(`Failed to check friendship: ${error.message}`);
    }
  }

  // Remove friendship
  async removeFriendship(userId, friendId) {
    try {
      const friendship = await this.checkFriendship(userId, friendId);
      
      if (!friendship) {
        throw new Error('Friendship not found');
      }

      // Delete friendship
      await deleteDoc(doc(db, this.friendshipsCollection, friendship.id));

      // Update user friends lists
      await userService.removeFriend(userId, friendId);

      return { success: true };
    } catch (error) {
      console.error('Error removing friendship:', error);
      throw new Error(`Failed to remove friendship: ${error.message}`);
    }
  }

  // Get user's friends with details
  async getFriendsWithDetails(userId, limitCount = 100) {
    try {
      const q = query(
        collection(db, this.friendshipsCollection),
        or(
          where('user1Id', '==', userId),
          where('user2Id', '==', userId)
        ),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const friends = [];
      
      for (const doc of querySnapshot.docs) {
        const friendshipData = doc.data();
        const friendId = friendshipData.user1Id === userId 
          ? friendshipData.user2Id 
          : friendshipData.user1Id;
        
        try {
          const friendProfile = await userService.getUserProfile(friendId);
          friends.push({
            friendshipId: doc.id,
            friendshipDate: friendshipData.createdAt,
            ...friendProfile
          });
        } catch (error) {
          console.warn(`Could not fetch friend profile ${friendId}:`, error);
        }
      }

      return friends;
    } catch (error) {
      console.error('Error getting friends with details:', error);
      throw new Error(`Failed to get friends with details: ${error.message}`);
    }
  }

  // Get mutual friends
  async getMutualFriends(userId, otherUserId) {
    try {
      const userFriends = await userService.getUserFriends(userId);
      const otherUserFriends = await userService.getUserFriends(otherUserId);
      
      const userFriendIds = userFriends.map(friend => friend.uid);
      const otherUserFriendIds = otherUserFriends.map(friend => friend.uid);
      
      const mutualFriendIds = userFriendIds.filter(id => otherUserFriendIds.includes(id));
      
      const mutualFriends = [];
      for (const friendId of mutualFriendIds) {
        try {
          const friendProfile = await userService.getUserProfile(friendId);
          mutualFriends.push(friendProfile);
        } catch (error) {
          console.warn(`Could not fetch mutual friend ${friendId}:`, error);
        }
      }

      return mutualFriends;
    } catch (error) {
      console.error('Error getting mutual friends:', error);
      throw new Error(`Failed to get mutual friends: ${error.message}`);
    }
  }

  // Real-time listener for received requests
  subscribeToReceivedRequests(userId, callback) {
    const q = query(
      collection(db, this.requestsCollection),
      where('receiverId', '==', userId),
      where('status', '==', FriendsService.REQUEST_STATUS.PENDING),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const requests = [];
      
      for (const doc of snapshot.docs) {
        const requestData = {
          id: doc.id,
          ...doc.data()
        };
        
        try {
          const senderProfile = await userService.getUserProfile(requestData.senderId);
          requestData.senderInfo = {
            uid: senderProfile.uid,
            displayName: senderProfile.displayName,
            photoURL: senderProfile.photoURL,
            bio: senderProfile.bio
          };
        } catch (error) {
          console.warn(`Could not fetch sender info for request ${doc.id}:`, error);
        }
        
        requests.push(requestData);
      }
      
      callback(requests);
    });
  }

  // Real-time listener for user's friendships
  subscribeToFriendships(userId, callback) {
    const q = query(
      collection(db, this.friendshipsCollection),
      or(
        where('user1Id', '==', userId),
        where('user2Id', '==', userId)
      ),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const friends = [];
      
      for (const doc of snapshot.docs) {
        const friendshipData = doc.data();
        const friendId = friendshipData.user1Id === userId 
          ? friendshipData.user2Id 
          : friendshipData.user1Id;
        
        try {
          const friendProfile = await userService.getUserProfile(friendId);
          friends.push({
            friendshipId: doc.id,
            friendshipDate: friendshipData.createdAt,
            ...friendProfile
          });
        } catch (error) {
          console.warn(`Could not fetch friend profile ${friendId}:`, error);
        }
      }
      
      callback(friends);
    });
  }

  // Get friend suggestions
  async getFriendSuggestions(userId, limitCount = 10) {
    try {
      const userFriends = await userService.getUserFriends(userId);
      const friendIds = userFriends.map(friend => friend.uid);
      
      // Get friends of friends
      const suggestions = new Map();
      
      for (const friendId of friendIds) {
        try {
          const friendOfFriends = await userService.getUserFriends(friendId);
          
          for (const potentialFriend of friendOfFriends) {
            if (potentialFriend.uid !== userId && !friendIds.includes(potentialFriend.uid)) {
              if (suggestions.has(potentialFriend.uid)) {
                suggestions.get(potentialFriend.uid).mutualFriends++;
              } else {
                suggestions.set(potentialFriend.uid, {
                  ...potentialFriend,
                  mutualFriends: 1
                });
              }
            }
          }
        } catch (error) {
          console.warn(`Could not fetch friends of friend ${friendId}:`, error);
        }
      }

      // Sort by mutual friends count and limit
      const sortedSuggestions = Array.from(suggestions.values())
        .sort((a, b) => b.mutualFriends - a.mutualFriends)
        .slice(0, limitCount);

      return sortedSuggestions;
    } catch (error) {
      console.error('Error getting friend suggestions:', error);
      throw new Error(`Failed to get friend suggestions: ${error.message}`);
    }
  }
}

export default new FriendsService();