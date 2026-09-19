import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingVisitor, setIncomingVisitor] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  // Function to poll/check any pending visitor approval for this resident
  const checkPendingApproval = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'RESIDENT' || !user?.flatId) {
      setIncomingVisitor(null);
      return;
    }
    try {
      const res = await api.get('/visitors/pending-approval');
      if (res.data?.data) {
        const item = res.data.data;
        const myFlatId = user.flatId?._id?.toString() || user.flatId?.toString();
        const itemFlatId = item.flatId?._id?.toString() || item.flatId?.toString();
        if (myFlatId && itemFlatId && myFlatId === itemFlatId) {
          setIncomingVisitor({
            visitorId: item._id,
            flatId: itemFlatId,
            visitorName: item.visitorName,
            phone: item.phone,
            purpose: item.purpose,
            vehicleNumber: item.vehicleNumber,
            flatNumber: item.flatId?.flatNumber || '',
            buildingName: item.buildingId?.name || '',
            createdAt: item.createdAt,
          });
        }
      }
    } catch (err) {
      console.error('Error checking pending visitor approval:', err);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIncomingVisitor(null);
      return;
    }

    // Security and Admin roles never hold incoming visitor approval requests
    if (user.role !== 'RESIDENT') {
      setIncomingVisitor(null);
    } else {
      // Check pending approvals on startup only for residents
      checkPendingApproval();
    }

    // Connect to backend via proxy, environment URL, or origin
    const socketServerUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;
    const socketInstance = socketServerUrl
      ? io(socketServerUrl, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
        })
      : io({
          withCredentials: true,
          transports: ['websocket', 'polling'],
        });

    const joinRooms = () => {
      console.log('⚡ Socket.IO Connected successfully:', socketInstance.id);

      const societyId = user.societyId?._id || user.societyId;
      if (societyId) {
        socketInstance.emit('join_society', societyId.toString());
      }

      const flatId = user.flatId?._id || user.flatId;
      if (user.role === 'RESIDENT' && flatId) {
        socketInstance.emit('join_resident', flatId.toString());
      }

      if (user.role === 'SECURITY' && societyId) {
        socketInstance.emit('join_security', societyId.toString());
      }
    };

    if (socketInstance.connected) {
      joinRooms();
    } else {
      socketInstance.on('connect', joinRooms);
    }

    // Resident Real-Time Listener: Walk-in Arrival Alert (Strictly for the destination resident only)
    socketInstance.on('visitor_arrival_request', (data) => {
      // Security guards and admins NEVER receive arrival approval modals
      if (user?.role !== 'RESIDENT') return;

      const myFlatId = user.flatId?._id?.toString() || user.flatId?.toString();
      // Only set if this resident belongs to the exact destination flat
      if (myFlatId && data?.flatId && data.flatId.toString() === myFlatId) {
        console.log('🔔 Gate Arrival Alert received for my flat:', data);
        setIncomingVisitor(data);
      }
    });

    // Resident Notification: Pass Verified & Checked In at Gate
    socketInstance.on('visitor_checked_in', (data) => {
      setActiveAlert({
        type: 'CHECK_IN',
        title: 'Visitor Passed Gate 1',
        message: `${data.visitorName} (${data.purpose}) has checked in through the gate.`,
      });
      setTimeout(() => setActiveAlert(null), 7000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user?.role, user?._id, user?.flatId, checkPendingApproval]);

  // Handle resident decision (Approve / Deny)
  const respondToArrival = async (visitorId, decision, rejectionReason = '') => {
    try {
      await api.patch(`/visitors/${visitorId}/respond`, {
        decision,
        rejectionReason,
      });
      setIncomingVisitor(null);
      return true;
    } catch (err) {
      console.error('Failed to respond to visitor arrival:', err);
      throw err;
    }
  };

  const dismissArrival = () => {
    setIncomingVisitor(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        incomingVisitor,
        activeAlert,
        respondToArrival,
        dismissArrival,
        checkPendingApproval,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
